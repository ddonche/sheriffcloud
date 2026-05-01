import { useEffect, useState } from "react"

const FONT = `"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif`

const C = {
  bg:         "#0b0916",
  surface:    "#12092a",
  border:     "#1e1535",
  accent:     "#7c3aed",
  pink:       "#e040a0",
  textPrimary:   "#f9fafb",
  textSecondary: "#9ca3af",
  textMuted:     "#6b7280",
}

type Pack = {
  id: string
  name: string
  price_usd: number
  credits: number
  bonus_credits: number
  sort_order: number
}

type BillingStatus = {
  balance: number
  free_remaining: number
  packs: Pack[]
}

type BillingModalProps = {
  supabase: any
  onClose: () => void
}

export function BillingModal({ supabase, onClose }: BillingModalProps) {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBillingStatus()
  }, [])

  async function loadBillingStatus() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/get_billing_status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data?.ok) setStatus(data)
      else setError(data?.error ?? "Failed to load billing info")
    } catch (err: any) {
      setError(err.message ?? "Failed to load billing info")
    } finally {
      setLoading(false)
    }
  }

  async function buyPack(pack: Pack) {
    setPurchasing(pack.id); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/create_checkout_session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pack_id: pack.id }),
      })
      const data = await res.json()
      if (data?.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setError(data?.error ?? "Failed to start checkout")
      }
    } catch (err: any) {
      setError(err.message ?? "Checkout failed")
    } finally {
      setPurchasing(null)
    }
  }

  const mostPopularId = status?.packs?.find(p => p.name === "Most Popular")?.id

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&display=swap');`}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1001,
        width: "100%", maxWidth: 520,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
        fontFamily: FONT,
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary, fontFamily: "'Nunito', system-ui" }}>
              Get Credits
            </div>
            {status && (
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                Current balance:{" "}
                <span style={{ color: C.accent, fontWeight: 700 }}>
                  {status.balance.toLocaleString()} credits
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.textMuted, cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 28px 28px" }}>
          {error && (
            <div style={{
              padding: "10px 14px", marginBottom: 16,
              background: "#2a0a0a", border: "1px solid #7f1d1d",
              borderRadius: 8, fontSize: 13, color: "#fca5a5",
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <div style={{
                width: 28, height: 28,
                border: "3px solid #1f2937", borderTopColor: C.accent,
                borderRadius: "50%", animation: "billing-spin 0.7s linear infinite",
              }} />
              <style>{`@keyframes billing-spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {(status?.packs ?? []).map(pack => {
                const total      = pack.credits + pack.bonus_credits
                const isPopular  = pack.id === mostPopularId
                const isBuying   = purchasing === pack.id

                return (
                  <div
                    key={pack.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: `1.5px solid ${isPopular ? C.accent + "88" : C.border}`,
                      background: isPopular ? C.accent + "10" : "transparent",
                      position: "relative",
                    }}
                  >
                    {isPopular && (
                      <div style={{
                        position: "absolute", top: -10, left: 14,
                        background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                        color: "#fff", fontSize: 10, fontWeight: 800,
                        padding: "2px 10px", borderRadius: 20,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>
                        Most Popular
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
                        {pack.name}
                      </div>
                      <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                        {pack.credits.toLocaleString()} credits
                        {pack.bonus_credits > 0 && (
                          <span style={{ color: "#22c55e", fontWeight: 600 }}>
                            {" "}+ {pack.bonus_credits.toLocaleString()} bonus
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                        {total.toLocaleString()} total · ${(pack.price_usd / total * 100).toFixed(3)}¢ per credit
                      </div>
                    </div>

                    <button
                      onClick={() => buyPack(pack)}
                      disabled={!!purchasing}
                      style={{
                        padding: "9px 20px",
                        background: isPopular
                          ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
                          : "transparent",
                        border: `1.5px solid ${isPopular ? "transparent" : C.accent}`,
                        borderRadius: 8,
                        color: isPopular ? "#fff" : C.accent,
                        fontSize: 14, fontWeight: 700,
                        cursor: purchasing ? "not-allowed" : "pointer",
                        opacity: purchasing && !isBuying ? 0.5 : 1,
                        flexShrink: 0, marginLeft: 16,
                        fontFamily: FONT,
                        minWidth: 72, textAlign: "center",
                      }}
                    >
                      {isBuying ? "…" : `$${pack.price_usd}`}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 12, color: C.textMuted, textAlign: "center" }}>
            1 credit = $0.01 · Secure checkout via Stripe · Credits never expire
          </div>
        </div>
      </div>
    </>
  )
}
