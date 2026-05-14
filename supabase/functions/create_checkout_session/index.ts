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

type CheckoutBody = {
  product?: "sheriff" | "spur" | "chatterbox" | "holster"
  plan?: "core" | "pro" | "max"
  pack_id?: string
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

    let body: CheckoutBody = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const product = body.product
    const appUrl =
      product === "holster"
        ? (Deno.env.get("HOLSTER_APP_URL") || "https://holster.sheriffcloud.com")
        : product === "chatterbox" || body.pack_id
          ? (Deno.env.get("CHATTERBOX_APP_URL") || "https://chatterbox.sheriffcloud.com")
          : (Deno.env.get("SPUR_APP_URL") || Deno.env.get("APP_URL") || "https://spur.ink")

    // ── Holster subscription checkout ────────────────────────────────────────
    if (product === "holster") {
      const plan = body.plan === "max" ? "max" : "pro"

      const priceId = plan === "max"
        ? Deno.env.get("HOLSTER_MAX_PRICE_ID")
        : Deno.env.get("HOLSTER_PRO_PRICE_ID")

      if (!priceId) return json(500, { ok: false, error: `Missing Holster ${plan} price id` })

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing?checkout=cancelled`,
        allow_promotion_codes: true,
        customer_email: user.email ?? undefined,
        subscription_data: {
          metadata: {
            user_id: user.id,
            product: "holster",
            holster_plan: plan,
          },
        },
        metadata: {
          user_id: user.id,
          product: "holster",
          holster_plan: plan,
        },
      })

      return json(200, { ok: true, url: session.url, checkout_url: session.url, checkout_id: session.id })
    }

    // ── Chatterbox credit checkout ───────────────────────────────────────────
    if (product === "chatterbox" || body.pack_id) {
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

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: Math.round(pack.price_usd * 100),
              product_data: {
                name: `Chatterbox ${pack.name}`,
                description: `${totalCredits.toLocaleString()} credits${pack.bonus_credits > 0 ? ` (includes ${pack.bonus_credits.toLocaleString()} bonus)` : ""}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}?checkout=cancelled`,
        allow_promotion_codes: true,
        customer_email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
          product: "chatterbox",
          pack_id: packId,
          credits: String(totalCredits),
        },
      })

      const { error: orderError } = await supabase
        .from("chatterbox_stripe_orders")
        .insert({
          user_id: user.id,
          pack_id: packId,
          stripe_checkout_id: session.id,
          amount_usd: pack.price_usd,
          credits_to_grant: totalCredits,
          status: "pending",
        })

      if (orderError) console.error("Order insert error:", orderError.message)

      return json(200, { ok: true, url: session.url, checkout_url: session.url, checkout_id: session.id })
    }

    // ── Sheriff / Spur Core subscription checkout ────────────────────────────
    // Legacy empty body {} comes here.
    const corePriceId =
      Deno.env.get("SHERIFF_CORE_PRICE_ID") ||
      Deno.env.get("SPUR_CORE_PRICE_ID") ||
      Deno.env.get("CORE_PRICE_ID")

    if (!corePriceId) return json(500, { ok: false, error: "Missing Core price id" })

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: corePriceId, quantity: 1 }],
      success_url: `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      customer_email: user.email ?? undefined,
      subscription_data: {
        metadata: {
          user_id: user.id,
          product: "sheriff",
          base_plan: "core",
        },
      },
      metadata: {
        user_id: user.id,
        product: "sheriff",
        base_plan: "core",
      },
    })

    return json(200, { ok: true, url: session.url, checkout_url: session.url, checkout_id: session.id })
  } catch (err) {
    console.error("Checkout error:", err)
    return json(500, { ok: false, error: String(err) })
  }
})