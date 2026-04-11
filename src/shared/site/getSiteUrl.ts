export function getSiteUrl(site: {
  subdomain: string
  site_origin: string
  custom_domain?: string | null
}) {
  if (site.custom_domain) {
    return `https://${site.custom_domain}`
  }

  if (site.site_origin === "spur") {
    return `https://${site.subdomain}.spur.ink`
  }

  if (site.site_origin === "sheriffcloud") {
    return `https://${site.subdomain}.sheriffcloud.com`
  }

  if (site.site_origin === "saloon") {
    return `https://${site.subdomain}.saloon.whatever`
  }

  return `https://${site.subdomain}.sheriffcloud.com`
}