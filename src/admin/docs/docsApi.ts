import type {
  DocsBuildResponse,
  DocsListFilesResponse,
  DocsReadFileResponse,
  DocsSaveFileResponse,
} from "./DocsTypes"

const API_BASE = "/api"

async function apiFetch<T>(input: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(input, { ...init, headers })
  const raw = await res.text()
  let parsed: any = null
  try {
    parsed = JSON.parse(raw)
    if (typeof parsed === "string") parsed = JSON.parse(parsed)
  } catch {
    throw new Error(raw || `Request failed (${res.status})`)
  }
  if (!res.ok) throw new Error(parsed?.error || parsed?.message || raw || `Request failed (${res.status})`)
  return parsed as T
}

async function getToken(supabase: any): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token ?? ""
}

export async function listDocsFiles(
  supabase: any,
  _siteId: string,
  subdomain: string
): Promise<DocsListFilesResponse> {
  const token = await getToken(supabase)
  return apiFetch<DocsListFilesResponse>(`${API_BASE}/list_files?${encodeURIComponent(subdomain)}`, {}, token)
}

export async function readDocsFile(
  supabase: any,
  _siteId: string,
  subdomain: string,
  path: string
): Promise<DocsReadFileResponse> {
  const token = await getToken(supabase)
  const params = new URLSearchParams({ portal: subdomain, path })
  return apiFetch<DocsReadFileResponse>(`${API_BASE}/read_file?${params.toString()}`, {}, token)
}

export async function saveDocsFile(
  supabase: any,
  _siteId: string,
  subdomain: string,
  path: string,
  content: string
): Promise<DocsSaveFileResponse> {
  const token = await getToken(supabase)
  const params = new URLSearchParams({ portal: subdomain, path })
  return apiFetch<DocsSaveFileResponse>(`${API_BASE}/write_file?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: content,
  }, token)
}

export async function deleteDocsFile(
  supabase: any,
  _siteId: string,
  subdomain: string,
  path: string
): Promise<{ ok: boolean }> {
  const token = await getToken(supabase)
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/delete_file?${encodeURIComponent(subdomain)}&${path}`,
    {},
    token
  )
}

export async function initPortal(
  supabase: any,
  subdomain: string
): Promise<{ ok: boolean; message?: string; already_exists?: boolean }> {
  const token = await getToken(supabase)
  const res = await fetch(`${API_BASE}/create_portal?${encodeURIComponent(subdomain)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const raw = await res.text()
  let parsed: any = null
  try {
    parsed = JSON.parse(raw)
    if (typeof parsed === "string") parsed = JSON.parse(parsed)
  } catch {
    throw new Error(raw || `Request failed (${res.status})`)
  }
  if (parsed?.stderr === "portal already exists") {
    return { ok: true, already_exists: true }
  }
  if (!parsed?.ok) {
    throw new Error(parsed?.stderr || parsed?.error || parsed?.message || "Portal init failed")
  }
  return { ok: true, already_exists: false }
}

export async function buildDocsSite(
  supabase: any,
  subdomain: string
): Promise<DocsBuildResponse> {
  const token = await getToken(supabase)
  return apiFetch<DocsBuildResponse>(`${API_BASE}/build?${encodeURIComponent(subdomain)}`, {}, token)
}

export async function startUpload(
  supabase: any,
  subdomain: string
): Promise<{ ok: boolean; message?: string }> {
  const token = await getToken(supabase)
  return apiFetch<{ ok: boolean; message?: string }>(
    `${API_BASE}/start_upload?${encodeURIComponent(subdomain)}`,
    {},
    token
  )
}

export async function getUploadStatus(supabase: any, subdomain: string): Promise<{
  ok: boolean
  state: "idle" | "starting" | "uploading" | "success" | "failed"
  message?: string
  error?: string
}> {
  const token = await getToken(supabase)
  return apiFetch<{
    ok: boolean
    state: "idle" | "starting" | "uploading" | "success" | "failed"
    message?: string
    error?: string
  }>(`${API_BASE}/upload_status?${encodeURIComponent(subdomain)}`, {}, token)
}
