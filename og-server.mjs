import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const PORT = 9001

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function ogHtml({ title, description, imageUrl, pageUrl, siteName, authorName, publishedAt, subdomain }) {
  const esc = (s) => (s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  ${imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}" />
  <meta property="og:image:width" content="680" />
  <meta property="og:image:height" content="383" />` : ''}
  <meta property="og:site_name" content="${esc(siteName)}" />
  ${authorName ? `<meta property="article:author" content="${esc(authorName)}" />` : ''}
  ${publishedAt ? `<meta property="article:published_time" content="${esc(publishedAt)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:domain" content="${esc(subdomain)}.spur.ink" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  ${imageUrl ? `<meta name="twitter:image" content="${esc(imageUrl)}" />` : ''}
</head>
<body></body>
</html>`
}

// nginx rewrites crawler requests to /og/{subdomain}/blog/{slug}
createServer(async (req, res) => {
  const match = req.url.match(/^\/og\/([^/]+)\/blog\/([^/?]+)/)
  if (!match) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const subdomain = match[1]
  const slug = match[2]

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, subdomain')
    .eq('subdomain', subdomain)
    .maybeSingle()

  if (!site) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const { data: post } = await supabase
    .from('spur_posts')
    .select('title, excerpt, thumbnail_url, slug, published_at, author_id')
    .eq('site_id', site.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!post) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const { data: author } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', post.author_id)
    .maybeSingle()

  const pageUrl = `https://${subdomain}.spur.ink/blog/${slug}`
  const html = ogHtml({
    title: post.title,
    description: post.excerpt ?? '',
    imageUrl: post.thumbnail_url ?? null,
    pageUrl,
    siteName: site.name,
    authorName: author?.display_name ?? author?.username ?? null,
    publishedAt: post.published_at ?? null,
    subdomain,
  })

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(html)
}).listen(PORT)
