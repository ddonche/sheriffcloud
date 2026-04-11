export type AppSurface = "sheriff" | "admin" | "spur" | "site"

export function resolveSurface(hostname: string, pathname: string): AppSurface {
  const host = hostname.toLowerCase()

  // Admin by path or admin host
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    host === "admin.localhost" ||
    host === "admin.sheriffcloud.com"
  ) {
    return "admin"
  }

  // Main Spur surface
  if (
    host === "spur.ink" ||
    host === "www.spur.ink"
  ) {
    return "spur"
  }

  // Published Spur sites
  if (
    host.endsWith(".spur.ink") &&
    host !== "spur.ink" &&
    host !== "www.spur.ink"
  ) {
    return "site"
  }

  // Local dev support for published sites: localhost/?sub=mysite
  if (host === "localhost") {
    const sub = new URLSearchParams(window.location.search).get("sub")
    if (sub) return "site"
  }

  // Keep old path-based Spur route working for now
  if (pathname === "/spur" || pathname.startsWith("/spur/")) {
    return "spur"
  }

  return "sheriff"
}