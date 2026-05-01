import Stripe from "https://esm.sh/stripe@18.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-02-24.acacia",
})

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" })

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json(401, { ok: false, error: "Missing Authorization header" })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return json(401, { ok: false, error: "Unauthorized" })

    let body: { pack_id?: string }
    try { body = await req.json() } catch { return json(400, { ok: false, error: "Invalid JSON body" }) }

    const packId = body.pack_id?.trim()
    if (!packId) return json(400, { ok: false, error: "pack_id is required" })

    const { data: pack, error: packError } = await supabase
      .from("chatterbox_credit_packs")
      .select("*")
      .eq("id", packId)
      .eq("is_active", true)
      .single()

    if (packError || !pack) return json(404, { ok: false, error: "Pack not found" })

    const totalCredits = pack.credits + pack.bonus_credits
    const appUrl       = Deno.env.get("APP_URL") || "https://chatterbox.sheriffcloud.com"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency:     "usd",
            unit_amount:  Math.round(pack.price_usd * 100),
            product_data: {
              name:        `Chatterbox ${pack.name}`,
              description: `${totalCredits.toLocaleString()} credits${pack.bonus_credits > 0 ? ` (includes ${pack.bonus_credits.toLocaleString()} bonus)` : ""}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url:           `${appUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:            `${appUrl}?checkout=cancelled`,
      allow_promotion_codes: true,
      customer_email:        user.email ?? undefined,
      metadata: {
        user_id: user.id,
        pack_id: packId,
        credits: String(totalCredits),
      },
    })

    // Record pending order
    const { error: orderError } = await supabase
      .from("chatterbox_stripe_orders")
      .insert({
        user_id:            user.id,
        pack_id:            packId,
        stripe_checkout_id: session.id,
        amount_usd:         pack.price_usd,
        credits_to_grant:   totalCredits,
        status:             "pending",
      })

    if (orderError) {
      // Don't fail — webhook will still fulfill using metadata
      console.error("Order insert error:", orderError.message)
    }

    return json(200, { ok: true, checkout_url: session.url, checkout_id: session.id })

  } catch (err) {
    console.error("Checkout error:", err)
    return json(500, { ok: false, error: String(err) })
  }
})
