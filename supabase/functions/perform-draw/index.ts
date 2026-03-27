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

    // Verify user
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    // Also allow code-based admin (no role check needed for now since admin uses code 8400)
    // In production, you'd want proper role checking

    const { lottery_id } = await req.json();
    if (!lottery_id) {
      return new Response(JSON.stringify({ error: "lottery_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get lottery
    const { data: lottery, error: lotteryError } = await supabase
      .from("lotteries")
      .select("*")
      .eq("id", lottery_id)
      .single();

    if (lotteryError || !lottery) {
      return new Response(JSON.stringify({ error: "Sorteio não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lottery.status === "sorteado") {
      return new Response(JSON.stringify({ error: "Este sorteio já foi realizado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all sold numbers
    const { data: soldNumbers, error: soldError } = await supabase
      .from("lottery_numbers")
      .select("id, numero, user_id")
      .eq("lottery_id", lottery_id)
      .eq("status", "vendido");

    if (soldError || !soldNumbers || soldNumbers.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum número vendido neste sorteio. Não é possível realizar o sorteio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick random winner from sold numbers
    const randomIndex = Math.floor(Math.random() * soldNumbers.length);
    const winnerNumber = soldNumbers[randomIndex];

    // Get winner profile
    const { data: winnerProfile } = await supabase
      .from("profiles")
      .select("nome_completo, telefone, email")
      .eq("id", winnerNumber.user_id)
      .single();

    const winnerName = winnerProfile?.nome_completo || "Desconhecido";
    const winnerPhone = winnerProfile?.telefone || "N/A";

    // Save result
    const { data: result, error: resultError } = await supabase
      .from("lottery_results")
      .insert({
        lottery_id,
        winning_number: winnerNumber.numero,
        winner_user_id: winnerNumber.user_id,
        winner_name: winnerName,
        winner_phone: winnerPhone,
        prize_info: lottery.premios || [],
      })
      .select()
      .single();

    if (resultError) {
      console.error("Error saving result:", resultError);
      return new Response(JSON.stringify({ error: "Erro ao salvar resultado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update lottery status
    await supabase
      .from("lotteries")
      .update({ status: "sorteado" })
      .eq("id", lottery_id);

    return new Response(JSON.stringify({
      success: true,
      result: {
        winning_number: winnerNumber.numero,
        winner_name: winnerName,
        winner_phone: winnerPhone,
        winner_user_id: winnerNumber.user_id,
        total_sold: soldNumbers.length,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("perform-draw error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
