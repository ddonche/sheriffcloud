// Shared AES-256-GCM + PBKDF2 crypto for Holster encrypted vaults

export const PBKDF2_ITERATIONS = 600000

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  )
}

export async function makeVerifier(key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode("holster-verify"))
  return btoa(String.fromCharCode(...iv)) + "." + btoa(String.fromCharCode(...new Uint8Array(ct)))
}

export async function checkVerifier(key: CryptoKey, verifier: string): Promise<boolean> {
  try {
    const [ivB64, ctB64] = verifier.split(".")
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))
    const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0))
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
    return new TextDecoder().decode(pt) === "holster-verify"
  } catch { return false }
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext))
  return btoa(String.fromCharCode(...iv)) + "." + btoa(String.fromCharCode(...new Uint8Array(ct)))
}

export async function decrypt(key: CryptoKey, ciphertext: string): Promise<string> {
  const [ivB64, ctB64] = ciphertext.split(".")
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))
  const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0))
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
  return new TextDecoder().decode(pt)
}

// Shared PIN prompt component props type
export type PinPromptProps = {
  mode: "set" | "enter"
  onSuccess: (pin: string) => Promise<string | null>
  onSetPin: (key: CryptoKey, salt: string, verifier: string) => Promise<string | null>
}
