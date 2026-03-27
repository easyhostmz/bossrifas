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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { nome, descricao, imagem_url, preco_numero, total_numeros, data_inicio, data_fim, premios } = body;

    if (!nome || !data_fim || !preco_numero) {
      return new Response(JSON.stringify({ error: "Nome, preço e data fim são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create lottery
    const { data: lottery, error: lotteryError } = await supabase
      .from("lotteries")
      .insert({
        nome,
        descricao: descricao || "",
        imagem_url: imagem_url || "",
        preco_numero: preco_numero || 15,
        total_numeros: total_numeros || 1000000,
        data_inicio: data_inicio || new Date().toISOString(),
        data_fim,
        premios: premios || [],
        status: "ativo",
      })
      .select()
      .single();

    if (lotteryError) {
      console.error("Error creating lottery:", lotteryError);
      return new Response(JSON.stringify({ error: "Erro ao criar sorteio: " + lotteryError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate numbers in batches (limit to reasonable amount for edge function timeout)
    const total = Math.min(total_numeros || 1000000, 100000); // Cap at 100k for edge function
    const batchSize = 5000;
    
    for (let start = 0; start < total; start += batchSize) {
      const end = Math.min(start + batchSize, total);
      const rows = [];
      for (let i = start; i < end; i++) {
        rows.push({
          lottery_id: lottery.id,
          numero: String(i).padStart(6, "0"),
          status: "disponivel",
        });
      }
      const { error: insertError } = await supabase
        .from("lottery_numbers")
        .insert(rows);
      
      if (insertError) {
        console.error(`Error inserting numbers batch ${start}-${end}:`, insertError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      lottery,
      numbers_generated: total,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-lottery error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
