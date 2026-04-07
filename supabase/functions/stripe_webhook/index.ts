import Stripe from "https://esm.sh/stripe@18.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-02-24.acacia",
})

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const freeEntitlements = {
  site_limit: 3,
  custom_domain_access: false,
  sites_storage_limit_mb: 500,
  holster_storage_limit_mb: 0,
  media_storage_limit_mb: 0,
  creator_bundle_access: false,
  studio_access: false,
}

const coreEntitlements = {
  site_limit: 5,
  custom_domain_access: true,
  sites_storage_limit_mb: 500,
  holster_storage_limit_mb: 0,
  media_storage_limit_mb: 0,
  creator_bundle_access: false,
  studio_access: false,
}

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

  const { error: entitlementsError } = await supabase
    .from("account_entitlements")
    .upsert(
      {
        user_id: userId,

        // FORCE correct values
        site_limit: isCore ? 5 : 3,
        custom_domain_access: isCore ? true : false,

        sites_storage_limit_mb: 500,
        holster_storage_limit_mb: 0,
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

  console.log("Applied plan:", { userId, basePlan })
}

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature")
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 })
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id

      if (userId) {
        await applyPlan(userId, "core", "active")
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id

      if (userId) {
        // For launch: if the subscription still exists, keep them on Core.
        // Do NOT downgrade just because the status isn't literally "active" yet.
        await applyPlan(userId, "core", subscription.status)
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id

      if (userId) {
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
      JSON.stringify({
        error: err?.message ?? String(err),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})