export type AppSurface = "sheriff" | "admin" | "spur" | "site"

export function resolveSurface(hostname: string, pathname: string): AppSurface {
  const host = hostname.toLowerCase()

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    host === "admin.localhost" ||
    host === "admin.sheriffcloud.com"
  ) {
    return "admin"
  }

  if (
    host === "spur.ink" ||
    host === "www.spur.ink"
  ) {
    return "spur"
  }

  if (
    host.endsWith(".spur.ink") &&
    host !== "spur.ink" &&
    host !== "www.spur.ink"
  ) {
    return "site"
  }

  if (host === "localhost") {
    const sub = new URLSearchParams(window.location.search).get("sub")
    if (sub) return "site"
  }

  if (pathname === "/spur" || pathname.startsWith("/spur/")) {
    return "spur"
  }

  if (pathname === "/codex" || pathname.startsWith("/codex/")) {
    return "site"
  }

  if (host === "spur.localhost") {
      return "spur"
  }

  return "sheriff"
}
