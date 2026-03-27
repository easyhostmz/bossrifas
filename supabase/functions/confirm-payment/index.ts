import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { purchase_id } = await req.json();
    if (!purchase_id) {
      return new Response(JSON.stringify({ error: "purchase_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get purchase
    const { data: purchase, error: pErr } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", purchase_id)
      .single();

    if (pErr || !purchase) {
      return new Response(JSON.stringify({ error: "Compra não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (purchase.status === "pago") {
      return new Response(JSON.stringify({ message: "Compra já confirmada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update purchase to paid
    await supabase
      .from("purchases")
      .update({ status: "pago" })
      .eq("id", purchase_id);

    // Update transaction to success
    await supabase
      .from("transactions")
      .update({ status: "success", updated_at: new Date().toISOString() })
      .eq("purchase_id", purchase_id);

    // Mark numbers as sold
    const numeros = purchase.numeros as string[];
    if (numeros && numeros.length > 0) {
      await supabase
        .from("lottery_numbers")
        .update({ status: "vendido", user_id: purchase.user_id })
        .eq("lottery_id", purchase.lottery_id)
        .in("numero", numeros);
    }

    // Update sold count on lottery
    const { count } = await supabase
      .from("lottery_numbers")
      .select("*", { count: "exact", head: true })
      .eq("lottery_id", purchase.lottery_id)
      .eq("status", "vendido");

    await supabase
      .from("lotteries")
      .update({ numeros_vendidos: count || 0 })
      .eq("id", purchase.lottery_id);

    return new Response(JSON.stringify({ success: true, message: "Pagamento confirmado manualmente" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("confirm-payment error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
