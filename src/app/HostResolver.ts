export type AppSurface = "sheriff" | "admin"

export function resolveSurface(pathname: string): AppSurface {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin"
  }

  return "sheriff"
}