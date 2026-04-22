import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'
import { execFile } from 'child_process'
import { createWriteStream, mkdirSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
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

function jsonRes(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  res.end(JSON.stringify(data))
}

async function getUserFromAuth(authHeader) {
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error } = await adminClient.auth.getUser(token)
  if (error || !user) return null
  return user
}

async function verifySiteOwnership(user, subdomain) {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: site } = await adminClient
    .from('sites')
    .select('id, subdomain, owner_id, site_origin')
    .eq('subdomain', subdomain)
    .maybeSingle()
  if (!site) return null
  if (site.owner_id !== user.id) return null
  if (site.site_origin !== 'sheriffcloud') return null
  return site
}

// nginx rewrites crawler requests to /og/{subdomain}/blog/{slug}
createServer(async (req, res) => {

  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    })
    res.end()
    return
  }

  // ── Upload portal source zip ────────────────────────────────────────────────
  // POST /api/upload_portal?portal=goblin
  if (req.method === 'POST' && req.url.startsWith('/api/upload_portal')) {
    const urlObj = new URL(req.url, 'http://localhost')
    const portal = urlObj.searchParams.get('portal')

    if (!portal || portal.includes('..') || portal.includes('/')) {
      jsonRes(res, { ok: false, error: 'Invalid portal name' }, 400)
      return
    }

    // Auth
    const user = await getUserFromAuth(req.headers['authorization'])
    if (!user) {
      jsonRes(res, { ok: false, error: 'Unauthorized' }, 401)
      return
    }

    // Verify ownership
    const site = await verifySiteOwnership(user, portal)
    if (!site) {
      jsonRes(res, { ok: false, error: 'Forbidden' }, 403)
      return
    }

    const tmpZip = `/tmp/${portal}_upload.zip`
    const destDir = `/app/site/portals/${portal}`

    // Save zip to tmp
    try {
      await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(tmpZip)
        req.pipe(writeStream)
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
      })
    } catch (e) {
      jsonRes(res, { ok: false, error: `Failed to save zip: ${e.message}` }, 500)
      return
    }

    // Ensure destination exists
    try {
      mkdirSync(destDir, { recursive: true })
    } catch (e) {
      jsonRes(res, { ok: false, error: `Failed to create dir: ${e.message}` }, 500)
      return
    }

    // Extract zip
    await new Promise((resolve) => {
      execFile('unzip', ['-o', tmpZip, '-d', destDir], (error, stdout, stderr) => {
        if (error) {
          jsonRes(res, { ok: false, error: `Unzip failed: ${stderr || error.message}` }, 500)
        } else {
          jsonRes(res, { ok: true, message: `Uploaded and extracted to ${destDir}` })
        }
        resolve()
      })
    })

    return
  }

  // ── OG tag server ───────────────────────────────────────────────────────────
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
