import { supabase } from "./supabase"

export type HolsterPlan = "free" | "pro" | string

export type HolsterEntitlements = {
  user_id: string
  holster_plan: HolsterPlan
  holster_storage_limit_mb: number
  holster_collection_limit: number | null
  holster_max_upload_size_mb: number
}

export async function getHolsterEntitlements(userId: string): Promise<HolsterEntitlements | null> {
  const { data, error } = await supabase
    .from("account_entitlements")
    .select(`
      user_id,
      holster_plan,
      holster_storage_limit_mb,
      holster_collection_limit,
      holster_max_upload_size_mb
    `)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error

  return data as HolsterEntitlements | null
}