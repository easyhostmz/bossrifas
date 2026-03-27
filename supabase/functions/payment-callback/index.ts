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

    const body = await req.json();
    const { debito_reference, status } = body;

    if (!debito_reference || !status) {
      return new Response(JSON.stringify({ error: "Missing debito_reference or status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*, purchases!inner(id, lottery_id, numeros, user_id)")
      .eq("debito_reference", debito_reference)
      .single();

    if (txError || !transaction) {
      console.error("Transaction not found for ref:", debito_reference);
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: if already success, ignore
    if (transaction.status === "success") {
      return new Response(JSON.stringify({ message: "Already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedStatus = status.toLowerCase();
    const purchase = (transaction as any).purchases;

    if (normalizedStatus === "success" || normalizedStatus === "completed") {
      // Update transaction
      await supabase
        .from("transactions")
        .update({ status: "success", updated_at: new Date().toISOString() })
        .eq("id", transaction.id);

      // Update purchase
      await supabase
        .from("purchases")
        .update({ status: "pago" })
        .eq("id", purchase.id);

      // Mark numbers as sold
      const numeros = purchase.numeros as string[];
      if (numeros && numeros.length > 0) {
        await supabase
          .from("lottery_numbers")
          .update({ status: "vendido", user_id: purchase.user_id })
          .eq("lottery_id", purchase.lottery_id)
          .in("numero", numeros);
      }
    } else if (normalizedStatus === "failed" || normalizedStatus === "error") {
      // Update transaction
      await supabase
        .from("transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", transaction.id);

      // Update purchase
      await supabase
        .from("purchases")
        .update({ status: "falhou" })
        .eq("id", purchase.id);

      // Release numbers
      const numeros = purchase.numeros as string[];
      if (numeros && numeros.length > 0) {
        await supabase
          .from("lottery_numbers")
          .update({ status: "disponivel", user_id: null, reserved_at: null, expires_at: null })
          .eq("lottery_id", purchase.lottery_id)
          .in("numero", numeros);
      }
    }

    return new Response(JSON.stringify({ message: "OK" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("payment-callback error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
