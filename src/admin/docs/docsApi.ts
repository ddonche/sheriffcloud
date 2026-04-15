import type {
  DocsBuildResponse,
  DocsListFilesResponse,
  DocsReadFileResponse,
  DocsSaveFileResponse,
} from "./DocsTypes"

async function getAccessToken(supabase: any): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token ?? null
}

async function apiFetch<T>(
  supabase: any,
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken(supabase)

  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  const raw = await res.text()

  let parsed: any = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(raw || `Request failed (${res.status})`)
  }

  if (!res.ok) {
    throw new Error(parsed?.error || parsed?.message || raw || `Request failed (${res.status})`)
  }

  return parsed as T
}

export async function listDocsFiles(
  supabase: any,
  siteId: string
): Promise<DocsListFilesResponse> {
  return apiFetch<DocsListFilesResponse>(
    supabase,
    `/api/docs/sites/${siteId}/files`
  )
}

export async function readDocsFile(
  supabase: any,
  siteId: string,
  path: string
): Promise<DocsReadFileResponse> {
  const url = `/api/docs/sites/${siteId}/file?path=${encodeURIComponent(path)}`
  return apiFetch<DocsReadFileResponse>(supabase, url)
}

export async function saveDocsFile(
  supabase: any,
  siteId: string,
  path: string,
  content: string
): Promise<DocsSaveFileResponse> {
  return apiFetch<DocsSaveFileResponse>(
    supabase,
    `/api/docs/sites/${siteId}/file`,
    {
      method: "POST",
      body: JSON.stringify({ path, content }),
    }
  )
}

export async function buildDocsSite(
  supabase: any,
  siteId: string
): Promise<DocsBuildResponse> {
  return apiFetch<DocsBuildResponse>(
    supabase,
    `/api/docs/sites/${siteId}/build`,
    {
      method: "POST",
      body: JSON.stringify({ mode: "full" }),
    }
  )
}