import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

const FREE_TIER_LIMIT = 10

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" })

  const supabaseUrl        = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json(401, { ok: false, error: "Missing Authorization header" })

  let userId: string
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "")
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    userId = payload.sub
    if (!userId) throw new Error("No subject")
  } catch {
    return json(401, { ok: false, error: "Invalid token" })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const today = new Date().toISOString().slice(0, 10)

  const [creditsRes, freeRes, packsRes] = await Promise.all([
    supabase
      .from("chatterbox_credits")
      .select("balance, lifetime_earned, lifetime_spent")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("chatterbox_free_tier")
      .select("responses")
      .eq("user_id", userId)
      .eq("date", today)
      .single(),
    supabase
      .from("chatterbox_credit_packs")
      .select("id, name, price_usd, credits, bonus_credits, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ])

  const balance       = creditsRes.data?.balance        ?? 0
  const freeUsed      = freeRes.data?.responses         ?? 0
  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - freeUsed)

  return json(200, {
    ok: true,
    balance,
    free_remaining:  freeRemaining,
    free_limit:      FREE_TIER_LIMIT,
    lifetime_earned: creditsRes.data?.lifetime_earned ?? 0,
    lifetime_spent:  creditsRes.data?.lifetime_spent  ?? 0,
    packs:           packsRes.data ?? [],
  })
})
