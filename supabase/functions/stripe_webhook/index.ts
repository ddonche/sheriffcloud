import Stripe from "https://esm.sh/stripe@18.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-02-24.acacia",
})

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

type HolsterPlan = "free" | "pro" | "max"

const HOLSTER_PLANS: Record<HolsterPlan, {
  storageMb: number
  collectionLimit: number | null
  maxUploadSizeMb: number
}> = {
  free: {
    storageMb: 250,
    collectionLimit: 20,
    maxUploadSizeMb: 10,
  },
  pro: {
    storageMb: 5120,
    collectionLimit: null,
    maxUploadSizeMb: 250,
  },
  max: {
    storageMb: 51200,
    collectionLimit: null,
    maxUploadSizeMb: 2048,
  },
}

function normalizeHolsterPlan(value: unknown): HolsterPlan {
  if (value === "pro" || value === "max") return value
  return "free"
}

// ── Sheriff Cloud plan fulfillment ────────────────────────────────────────────

async function applyPlan(userId: string, basePlan: "free" | "core", status: string) {
  const isCore = basePlan === "core"

  const { error: plansError } = await supabase
    .from("account_plans")
    .upsert(
      {
        user_id: userId,
        base_plan: basePlan,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (plansError) {
    console.error("account_plans error", plansError)
    throw plansError
  }

  const { data: existingEntitlements } = await supabase
    .from("account_entitlements")
    .select(`
      holster_plan,
      holster_storage_limit_mb,
      holster_collection_limit,
      holster_max_upload_size_mb
    `)
    .eq("user_id", userId)
    .maybeSingle()

  const { error: entitlementsError } = await supabase
    .from("account_entitlements")
    .upsert(
      {
        user_id: userId,
        site_limit: isCore ? 5 : 3,
        custom_domain_access: isCore,
        sites_storage_limit_mb: 500,

        holster_plan: existingEntitlements?.holster_plan ?? "free",
        holster_storage_limit_mb: existingEntitlements?.holster_storage_limit_mb ?? HOLSTER_PLANS.free.storageMb,
        holster_collection_limit: existingEntitlements?.holster_collection_limit ?? HOLSTER_PLANS.free.collectionLimit,
        holster_max_upload_size_mb: existingEntitlements?.holster_max_upload_size_mb ?? HOLSTER_PLANS.free.maxUploadSizeMb,

        media_storage_limit_mb: 0,
        creator_bundle_access: false,
        studio_access: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (entitlementsError) {
    console.error("account_entitlements error", entitlementsError)
    throw entitlementsError
  }

  console.log("Applied Sheriff plan:", { userId, basePlan, status })
}

// ── Holster plan fulfillment ──────────────────────────────────────────────────

async function applyHolsterPlan(userId: string, plan: HolsterPlan) {
  const config = HOLSTER_PLANS[plan]

  const { data: existingEntitlements } = await supabase
    .from("account_entitlements")
    .select(`
      site_limit,
      custom_domain_access,
      sites_storage_limit_mb,
      media_storage_limit_mb,
      creator_bundle_access,
      studio_access
    `)
    .eq("user_id", userId)
    .maybeSingle()

  const { error } = await supabase
    .from("account_entitlements")
    .upsert(
      {
        user_id: userId,

        site_limit: existingEntitlements?.site_limit ?? 3,
        custom_domain_access: existingEntitlements?.custom_domain_access ?? false,
        sites_storage_limit_mb: existingEntitlements?.sites_storage_limit_mb ?? 500,

        holster_plan: plan,
        holster_storage_limit_mb: config.storageMb,
        holster_collection_limit: config.collectionLimit,
        holster_max_upload_size_mb: config.maxUploadSizeMb,

        media_storage_limit_mb: existingEntitlements?.media_storage_limit_mb ?? 0,
        creator_bundle_access: existingEntitlements?.creator_bundle_access ?? false,
        studio_access: existingEntitlements?.studio_access ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    console.error("applyHolsterPlan error", error)
    throw error
  }

  console.log("Applied Holster plan:", { userId, plan, config })
}

// ── Chatterbox credit fulfillment ─────────────────────────────────────────────

async function fulfillCreditPurchase(session: Stripe.Checkout.Session) {
  const userId     = session.metadata?.user_id
  const credits    = parseInt(session.metadata?.credits ?? "0", 10)
  const checkoutId = session.id

  if (!userId || !credits) {
    console.error("fulfillCreditPurchase: missing metadata", session.metadata)
    return
  }

  const { data: order } = await supabase
    .from("chatterbox_stripe_orders")
    .select("id, status, credits_to_grant")
    .eq("stripe_checkout_id", checkoutId)
    .single()

  if (order?.status === "complete") {
    console.log("Credits already fulfilled for checkout:", checkoutId)
    return
  }

  const { error: creditError } = await supabase.rpc("chatterbox_add_credits", {
    p_user_id:         userId,
    p_amount:          order?.credits_to_grant ?? credits,
    p_reason:          "pack_purchase",
    p_stripe_order_id: order?.id ?? null,
  })

  if (creditError) {
    console.error("chatterbox_add_credits error:", creditError)
    throw creditError
  }

  if (order?.id) {
    const { error: updateError } = await supabase
      .from("chatterbox_stripe_orders")
      .update({
        status:                "complete",
        stripe_payment_intent: session.payment_intent as string ?? null,
        fulfilled_at:          new Date().toISOString(),
      })
      .eq("id", order.id)

    if (updateError) console.error("Order update error:", updateError)
  }

  console.log(`Chatterbox credits fulfilled: ${order?.credits_to_grant ?? credits} → user ${userId}`)
}

// ── Webhook handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature")
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 })
    }

    const body          = await req.text()
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    const event         = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.user_id

      if (!userId) {
        console.error("checkout.session.completed: no user_id in metadata")
      } else if (session.metadata?.credits) {
        await fulfillCreditPurchase(session)
      } else if (session.metadata?.product === "holster") {
        const plan = normalizeHolsterPlan(session.metadata?.holster_plan)
        await applyHolsterPlan(userId, plan)
      } else if (session.metadata?.base_plan) {
        await applyPlan(userId, "core", "active")
      } else {
        console.warn("checkout.session.completed: unrecognized metadata", session.metadata)
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id

      if (userId && subscription.metadata?.product === "holster") {
        const activeLikeStatuses = new Set(["active", "trialing"])
        const plan = activeLikeStatuses.has(subscription.status)
          ? normalizeHolsterPlan(subscription.metadata?.holster_plan)
          : "free"

        await applyHolsterPlan(userId, plan)
      } else if (userId) {
        await applyPlan(userId, "core", subscription.status)
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id

      if (userId && subscription.metadata?.product === "holster") {
        await applyHolsterPlan(userId, "free")
      } else if (userId) {
        await applyPlan(userId, "free", "active")
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("stripe_webhook failed", err)
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})