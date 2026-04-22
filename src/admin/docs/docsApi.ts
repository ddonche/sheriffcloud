import type {
  DocsBuildResponse,
  DocsListFilesResponse,
  DocsReadFileResponse,
  DocsSaveFileResponse,
} from "./DocsTypes"

const API_BASE = "/api"

async function apiFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, init)
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

export async function listDocsFiles(
  _supabase: any,
  _siteId: string,
  subdomain: string
): Promise<DocsListFilesResponse> {
  return apiFetch<DocsListFilesResponse>(`${API_BASE}/list_files?${encodeURIComponent(subdomain)}`)
}

export async function readDocsFile(
  _supabase: any,
  _siteId: string,
  subdomain: string,
  path: string
): Promise<DocsReadFileResponse> {
  const params = new URLSearchParams({ portal: subdomain, path })
  return apiFetch<DocsReadFileResponse>(`${API_BASE}/read_file?${params.toString()}`)
}

export async function saveDocsFile(
  _supabase: any,
  _siteId: string,
  subdomain: string,
  path: string,
  content: string
): Promise<DocsSaveFileResponse> {
  const params = new URLSearchParams({ portal: subdomain, path })
  return apiFetch<DocsSaveFileResponse>(`${API_BASE}/write_file?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: content,
  })
}

export async function deleteDocsFile(
  _supabase: any,
  _siteId: string,
  subdomain: string,
  path: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`${API_BASE}/delete_file?${encodeURIComponent(subdomain)}&${encodeURIComponent(path)}`)
}

export async function buildDocsSite(
  _supabase: any,
  subdomain: string
): Promise<DocsBuildResponse> {
  return apiFetch<DocsBuildResponse>(`${API_BASE}/build?${encodeURIComponent(subdomain)}`)
}

export async function startUpload(
  subdomain: string
): Promise<{ ok: boolean; message?: string }> {
  return apiFetch<{ ok: boolean; message?: string }>(`${API_BASE}/start_upload?${encodeURIComponent(subdomain)}`)
}

export async function getUploadStatus(subdomain: string): Promise<{
  ok: boolean
  state: "idle" | "starting" | "uploading" | "success" | "failed"
  message?: string
  error?: string
}> {
  return apiFetch<{
    ok: boolean
    state: "idle" | "starting" | "uploading" | "success" | "failed"
    message?: string
    error?: string
  }>(`${API_BASE}/upload_status?${encodeURIComponent(subdomain)}`)
}
