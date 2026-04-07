import { useRef, useState } from "react"

type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  has_ai_access: boolean
  is_admin: boolean
  is_suspended: boolean
}

const FONT = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

export default function AccountPanel({
  profile,
  supabase,
  onSaved,
}: {
  profile: Profile
  supabase: any
  onSaved: (profile: Profile) => void
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "")
  const [username, setUsername] = useState(profile.username ?? "")
  const [bio, setBio] = useState(profile.bio ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function cleanUsername(val: string) {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg"
      const path = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select("id, username, display_name, bio, avatar_url, has_ai_access, is_admin, is_suspended")
        .single()

      if (updateError) throw new Error(updateError.message)

      setAvatarUrl(publicUrl)
      onSaved(updated)
      setSuccess("Avatar updated.")
    } catch (err: any) {
      setError(err.message ?? "Avatar upload failed.")
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const cleanUser = cleanUsername(username)

      if (!cleanUser) {
        setError("Username is required.")
        setSaving(false)
        return
      }

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          username: cleanUser,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select("id, username, display_name, bio, avatar_url, has_ai_access, is_admin, is_suspended")
        .single()

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("That username is already taken.")
        }
        throw new Error(updateError.message)
      }

      onSaved(updated)
      setSuccess("Profile saved.")
    } catch (err: any) {
      setError(err.message ?? "Save failed.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: "32px", fontFamily: FONT, overflowY: "auto", height: "100%" }}>
      <div style={{ maxWidth: 760 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: "#111827" }}>
          Account
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6b7280" }}>
          Your profile is shared across Sheriff Cloud, Spur, Holster, comments, and future apps.
        </p>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>
            Profile
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 96, flexShrink: 0 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    background: "#e5e7eb",
                    color: "#374151",
                    fontSize: 30,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #d4d4d8",
                  }}
                >
                  {(displayName || username || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                  e.currentTarget.value = ""
                }}
              />

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 6,
                    border: "1px solid #d4d4d8",
                    background: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                    cursor: uploading ? "default" : "pointer",
                    fontFamily: FONT,
                  }}
                >
                  {uploading ? "Uploading…" : avatarUrl ? "Replace Avatar" : "Upload Avatar"}
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null)
                      setSuccess(null)
                      const { data: updated, error: updateError } = await supabase
                        .from("profiles")
                        .update({
                          avatar_url: null,
                          updated_at: new Date().toISOString(),
                        })
                        .eq("id", profile.id)
                        .select("id, username, display_name, bio, avatar_url, has_ai_access, is_admin, is_suspended")
                        .single()

                      if (updateError) {
                        setError(updateError.message)
                        return
                      }

                      setAvatarUrl(null)
                      onSaved(updated)
                      setSuccess("Avatar removed.")
                    }}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 6,
                      border: "1px solid #fecaca",
                      background: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#dc2626",
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Use one avatar and bio across the whole ecosystem.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Display Name
              </label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your public name"
                style={{
                  width: "100%",
                  border: "1px solid #d4d4d8",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#111827",
                  outline: "none",
                  fontFamily: FONT,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Username
              </label>
              <input
                value={username}
                onChange={e => setUsername(cleanUsername(e.target.value))}
                placeholder="your-handle"
                style={{
                  width: "100%",
                  border: "1px solid #d4d4d8",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#111827",
                  outline: "none",
                  fontFamily: FONT,
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people who you are."
              rows={5}
              style={{
                width: "100%",
                border: "1px solid #d4d4d8",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 14,
                color: "#111827",
                outline: "none",
                fontFamily: FONT,
                resize: "vertical",
              }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 13 }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 18px",
                borderRadius: 6,
                border: "none",
                background: "#1e293b",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
                fontFamily: FONT,
              }}
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}