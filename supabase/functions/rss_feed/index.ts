import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-subdomain',
}

function escXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const subdomain = req.headers.get('x-subdomain') ?? ''
  if (!subdomain) return new Response('Not found', { status: 404 })

  // Resolve site
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, subdomain, owner_id')
    .eq('subdomain', subdomain)
    .maybeSingle()

  if (!site) return new Response('Not found', { status: 404 })

  // Fetch author
  const { data: author } = await supabase
    .from('profiles')
    .select('display_name, username, bio')
    .eq('id', site.owner_id)
    .maybeSingle()

  const authorName = author?.display_name || author?.username || site.name

  // Fetch published posts
  const { data: posts } = await supabase
    .from('spur_posts')
    .select('title, slug, excerpt, content, thumbnail_url, tags, published_at, updated_at')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const siteUrl = `https://${site.subdomain}.sheriffcloud.com`
  const feedUrl = `${siteUrl}/rss`
  const now = new Date().toUTCString()

  const items = (posts ?? []).map(post => {
    const url = `${siteUrl}/blog/${post.slug}`
    const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : now
    const excerpt = post.excerpt ? escXml(post.excerpt) : ''
    const tags = (post.tags ?? []).map((t: string) => `<category>${escXml(t)}</category>`).join('\n      ')

    return `
    <item>
      <title>${escXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${excerpt}</description>
      ${tags}
      ${post.thumbnail_url ? `<enclosure url="${escXml(post.thumbnail_url)}" type="image/jpeg" length="0" />` : ''}
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(site.name)}</title>
    <link>${siteUrl}</link>
    <description>${escXml(author?.bio ?? site.name)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <managingEditor>${escXml(authorName)}</managingEditor>
    <generator>Spur by Sheriff Cloud</generator>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
})
