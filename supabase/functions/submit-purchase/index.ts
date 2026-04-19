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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { lottery_id, selected_numbers, telefone, whatsapp, metodo, comprovativo_url, affiliate_code } = body;

    if (!lottery_id || !selected_numbers?.length || !telefone || !metodo || !comprovativo_url) {
      return new Response(JSON.stringify({ error: "Dados obrigatórios em falta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const quantidade = selected_numbers.length;

    // Get lottery
    const { data: lottery, error: lotteryError } = await supabase
      .from("lotteries").select("*").eq("id", lottery_id).eq("status", "ativo").single();

    if (lotteryError || !lottery) {
      return new Response(JSON.stringify({ error: "Sorteio não encontrado ou encerrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valorTotal = Number(lottery.preco_numero) * quantidade;

    // Check selected numbers are available
    const { data: nums, error: numsError } = await supabase
      .from("lottery_numbers")
      .select("id, numero")
      .eq("lottery_id", lottery_id)
      .eq("status", "disponivel")
      .in("numero", selected_numbers);

    if (numsError || !nums || nums.length < selected_numbers.length) {
      const unavailable = selected_numbers.filter(
        (n: string) => !nums?.find((x: any) => x.numero === n)
      );
      return new Response(JSON.stringify({
        error: `Números indisponíveis: ${unavailable.join(", ")}. Selecione outros.`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const numberIds = nums.map((n: any) => n.id);
    const numerosStr = nums.map((n: any) => n.numero);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h for manual

    // Reserve numbers
    const { error: reserveError } = await supabase
      .from("lottery_numbers")
      .update({
        status: "reservado",
        user_id: user.id,
        reserved_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .in("id", numberIds)
      .eq("status", "disponivel");

    if (reserveError) {
      return new Response(JSON.stringify({ error: "Erro ao reservar números. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate affiliate_code (if provided): must exist + active + not own purchase
    let validatedAffiliateCode: string | null = null;
    if (affiliate_code && typeof affiliate_code === "string") {
      const code = affiliate_code.trim().toUpperCase();
      const { data: aff } = await supabase
        .from("affiliates")
        .select("user_id, status")
        .eq("codigo", code)
        .maybeSingle();
      if (aff && aff.status === "ativo" && aff.user_id !== user.id) {
        validatedAffiliateCode = code;
      }
    }

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        lottery_id,
        quantidade,
        numeros: numerosStr,
        valor_total: valorTotal,
        telefone,
        whatsapp: whatsapp || telefone,
        metodo,
        comprovativo_url,
        status: "pendente",
        affiliate_code: validatedAffiliateCode,
      })
      .select()
      .single();

    if (purchaseError) {
      // Rollback reservation
      await supabase
        .from("lottery_numbers")
        .update({ status: "disponivel", user_id: null, reserved_at: null, expires_at: null })
        .in("id", numberIds);
      console.error("Purchase insert error:", purchaseError);
      return new Response(JSON.stringify({ error: "Erro ao criar compra" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      purchase_id: purchase.id,
      numeros: numerosStr,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-purchase error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
