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

    const now = new Date().toISOString();

    // Find expired reservations
    const { data: expired, error: findError } = await supabase
      .from("lottery_numbers")
      .select("id, lottery_id, numero")
      .eq("status", "reservado")
      .lt("expires_at", now);

    if (findError) {
      console.error("Error finding expired:", findError);
      return new Response(JSON.stringify({ error: findError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ released: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiredIds = expired.map((n) => n.id);

    // Release them
    const { error: updateError } = await supabase
      .from("lottery_numbers")
      .update({
        status: "disponivel",
        user_id: null,
        reserved_at: null,
        expires_at: null,
      })
      .in("id", expiredIds);

    if (updateError) {
      console.error("Error releasing:", updateError);
    }

    console.log(`Released ${expiredIds.length} expired reservations`);

    return new Response(JSON.stringify({ released: expiredIds.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("release-expired error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
