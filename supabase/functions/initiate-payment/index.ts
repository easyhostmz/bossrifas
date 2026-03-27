import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEBITO_BASE = "https://my.debito.co.mz";

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
    const { action } = body;

    // ── STATUS CHECK ──
    if (action === "status") {
      const { debito_reference } = body;
      if (!debito_reference) {
        return new Response(JSON.stringify({ error: "debito_reference obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: settings } = await supabase
        .from("admin_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (!settings?.debito_api_token) {
        return new Response(JSON.stringify({ status: "COMPLETED", is_complete: true, message: "Modo teste" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const statusRes = await fetch(`${DEBITO_BASE}/api/v1/transactions/${debito_reference}/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${settings.debito_api_token}`,
            "Content-Type": "application/json",
          },
        });
        const statusData = await statusRes.json();
        console.log("Débito status response:", JSON.stringify(statusData));

        const isSuccess = ["COMPLETED", "SUCCESS", "SUCCESSFUL", "completed", "successful", "PAID", "paid"]
          .includes(statusData.status);
        const isFailed = ["FAILED", "REJECTED", "CANCELLED", "failed", "rejected", "cancelled"]
          .includes(statusData.status);

        if (isSuccess) {
          await supabase
            .from("transactions")
            .update({ status: "success", updated_at: new Date().toISOString() })
            .eq("debito_reference", debito_reference);

          const { data: tx } = await supabase
            .from("transactions")
            .select("purchase_id")
            .eq("debito_reference", debito_reference)
            .single();

          if (tx?.purchase_id) {
            await supabase
              .from("purchases")
              .update({ status: "pago" })
              .eq("id", tx.purchase_id);

            const { data: purchase } = await supabase
              .from("purchases")
              .select("lottery_id, numeros")
              .eq("id", tx.purchase_id)
              .single();

            if (purchase) {
              const nums = purchase.numeros as string[];
              for (const num of nums) {
                await supabase
                  .from("lottery_numbers")
                  .update({ status: "vendido" })
                  .eq("lottery_id", purchase.lottery_id)
                  .eq("numero", num);
              }
            }
          }
        } else if (isFailed) {
          await supabase
            .from("transactions")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("debito_reference", debito_reference);
        }

        return new Response(JSON.stringify({
          status: statusData.status || "PENDING",
          is_complete: isSuccess,
          is_failed: isFailed,
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (statusErr) {
        console.error("Status check error:", statusErr);
        return new Response(JSON.stringify({ status: "PENDING", is_complete: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── INITIATE PAYMENT ──
    const { lottery_id, quantidade, telefone, selected_numbers } = body;

    if (!lottery_id || !quantidade || !telefone || quantidade < 1) {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prefix = telefone.substring(0, 2);
    let metodo: string;
    if (prefix === "84" || prefix === "85") metodo = "mpesa";
    else if (prefix === "86" || prefix === "87") metodo = "emola";
    else {
      return new Response(JSON.stringify({ error: "Número não suportado. Use 84/85 (M-Pesa) ou 86/87 (eMola)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lottery, error: lotteryError } = await supabase
      .from("lotteries").select("*").eq("id", lottery_id).eq("status", "ativo").single();

    if (lotteryError || !lottery) {
      return new Response(JSON.stringify({ error: "Sorteio não encontrado ou encerrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valorTotal = Number(lottery.preco_numero) * quantidade;

    let availableNumbers: { id: string; numero: string }[];

    if (selected_numbers && Array.isArray(selected_numbers) && selected_numbers.length > 0) {
      // User selected specific numbers - verify they are available
      const { data: nums, error: numsError } = await supabase
        .from("lottery_numbers")
        .select("id, numero")
        .eq("lottery_id", lottery_id)
        .eq("status", "disponivel")
        .in("numero", selected_numbers);

      if (numsError || !nums || nums.length < selected_numbers.length) {
        const unavailable = selected_numbers.filter(
          n => !nums?.find(x => x.numero === n)
        );
        return new Response(JSON.stringify({
          error: `Números indisponíveis: ${unavailable.join(", ")}. Selecione outros números.`
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      availableNumbers = nums;
    } else {
      // Fallback: random assignment
      const { data: nums, error: numbersError } = await supabase
        .from("lottery_numbers").select("id, numero")
        .eq("lottery_id", lottery_id).eq("status", "disponivel").limit(quantidade);

      if (numbersError || !nums || nums.length < quantidade) {
        return new Response(JSON.stringify({ error: `Apenas ${nums?.length || 0} números disponíveis` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      availableNumbers = nums;
    }

    const numberIds = availableNumbers.map((n) => n.id);
    const numerosStr = availableNumbers.map((n) => n.numero);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: reserveError } = await supabase
      .from("lottery_numbers")
      .update({ status: "reservado", user_id: user.id, reserved_at: new Date().toISOString(), expires_at: expiresAt })
      .in("id", numberIds).eq("status", "disponivel");

    if (reserveError) {
      return new Response(JSON.stringify({ error: "Erro ao reservar números. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({ user_id: user.id, lottery_id, quantidade, numeros: numerosStr, valor_total: valorTotal, telefone, metodo, status: "pendente" })
      .select().single();

    if (purchaseError) {
      await supabase.from("lottery_numbers")
        .update({ status: "disponivel", user_id: null, reserved_at: null, expires_at: null })
        .in("id", numberIds);
      return new Response(JSON.stringify({ error: "Erro ao criar compra" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin settings
    const { data: settings } = await supabase
      .from("admin_settings").select("*")
      .order("updated_at", { ascending: false }).limit(1).single();

    if (!settings?.debito_api_token) {
      // Test mode — auto-complete
      const { data: transaction } = await supabase
        .from("transactions")
        .insert({ purchase_id: purchase.id, user_id: user.id, metodo, status: "success", amount: valorTotal, msisdn: telefone })
        .select().single();

      await supabase.from("purchases").update({ status: "pago" }).eq("id", purchase.id);
      for (const num of numerosStr) {
        await supabase.from("lottery_numbers")
          .update({ status: "vendido" })
          .eq("lottery_id", lottery_id).eq("numero", num);
      }

      return new Response(JSON.stringify({
        status: "success",
        purchase_id: purchase.id,
        transaction_id: transaction?.id,
        numeros: numerosStr,
        message: "Modo teste — completado automaticamente",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call Débito API
    const walletId = metodo === "mpesa" ? settings.wallet_mpesa : settings.wallet_emola;
    const endpoint = metodo === "mpesa"
      ? `${DEBITO_BASE}/api/v1/wallets/${walletId}/c2b/mpesa`
      : `${DEBITO_BASE}/api/v1/wallets/${walletId}/c2b/emola`;

    let debitoRef = null;
    let debitoTxId = null;
    let debitoStatus = "pending";

    try {
      console.log(`Calling Débito: ${endpoint}`, { msisdn: telefone, amount: valorTotal });
      const debitoRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.debito_api_token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          msisdn: telefone,
          amount: valorTotal,
          reference_description: `Boss Premios - ${lottery.nome}`.substring(0, 32),
        }),
      });

      const debitoData = await debitoRes.json();
      console.log("Débito response:", JSON.stringify(debitoData));

      if (debitoRes.ok) {
        debitoRef = debitoData.debito_reference || debitoData.reference || null;
        debitoTxId = String(debitoData.transaction_id || debitoData.id || "");
        debitoStatus = "pending";
      } else {
        console.error("Débito API error:", debitoRes.status, debitoData);
      }
    } catch (apiErr) {
      console.error("Débito API call failed:", apiErr);
    }

    const { data: transaction } = await supabase
      .from("transactions")
      .insert({
        purchase_id: purchase.id, user_id: user.id, metodo,
        debito_reference: debitoRef, transaction_id: debitoTxId,
        status: debitoStatus, amount: valorTotal, msisdn: telefone,
      })
      .select().single();

    return new Response(JSON.stringify({
      status: debitoStatus,
      purchase_id: purchase.id,
      transaction_id: transaction?.id,
      debito_reference: debitoRef,
      numeros: numerosStr,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("initiate-payment error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
