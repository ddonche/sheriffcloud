import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-subdomain',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getCommentCountsForEntities(supabase: any, entityType: string, entityIds: string[]) {
  const { data } = await supabase
    .from('comments')
    .select('entity_id')
    .eq('entity_type', entityType)
    .in('entity_id', entityIds)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.entity_id] = (counts[row.entity_id] ?? 0) + 1
  }
  return counts
}

async function getLikesForEntities(supabase: any, entityType: string, entityIds: string[], userId: string | null) {
  const { data: likes } = await supabase
    .from('likes')
    .select('entity_id')
    .eq('entity_type', entityType)
    .in('entity_id', entityIds)

  const counts: Record<string, number> = {}
  const liked: Record<string, boolean> = {}

  for (const row of likes ?? []) {
    counts[row.entity_id] = (counts[row.entity_id] ?? 0) + 1
  }

  if (userId) {
    const { data: userLikes } = await supabase
      .from('likes')
      .select('entity_id')
      .eq('entity_type', entityType)
      .in('entity_id', entityIds)
      .eq('user_id', userId)

    for (const row of userLikes ?? []) {
      liked[row.entity_id] = true
    }
  }

  return { counts, liked }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Use service role for data fetching
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Get current user from auth header if present
  const authHeader = req.headers.get('authorization') ?? ''
  const userToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  let userId: string | null = null

  if (userToken) {
    const { data: { user } } = await supabase.auth.getUser(userToken)
    userId = user?.id ?? null
  }

  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? '/'
  const subdomain = req.headers.get('x-subdomain') ?? ''

  if (!subdomain) return json({ type: 'not_found' }, 404)

  // ── Resolve site ──────────────────────────────────────────────
  const { data: site, error: siteErr } = await supabase
    .from('sites')
    .select('id, name, subdomain, custom_domain, owner_id, site_type, logo_url, bio, tagline')
    .eq('subdomain', subdomain)
    .maybeSingle()

  if (siteErr || !site) return json({ type: 'not_found' })

  // ── Fetch authors (all spur_authors for this site, joined to profiles) ───────
  const { data: authorRows } = await supabase
    .from('spur_authors')
    .select('user_id, role, joined_at')
    .eq('site_id', site.id)

  const { data: publishedPostAuthors } = await supabase
    .from('spur_posts')
    .select('author_id')
    .eq('site_id', site.id)
    .eq('status', 'published')

  const authorUserIds: string[] = [
    ...new Set([
      site.owner_id,
      ...(authorRows ?? []).map((r: any) => r.user_id),
      ...(publishedPostAuthors ?? []).map((p: any) => p.author_id),
    ]),
  ]

  const roleMap: Record<string, string> = { [site.owner_id]: 'owner' }
  for (const row of authorRows ?? []) {
    roleMap[row.user_id] = row.role
  }

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .in('id', authorUserIds)

  // Get post counts and last published per author
  const { data: postStats } = await supabase
    .from('spur_posts')
    .select('author_id, published_at')
    .eq('site_id', site.id)
    .eq('status', 'published')

  const postCountMap: Record<string, number> = {}
  const lastPublishedMap: Record<string, string> = {}
  for (const p of postStats ?? []) {
    postCountMap[p.author_id] = (postCountMap[p.author_id] ?? 0) + 1
    if (!lastPublishedMap[p.author_id] || p.published_at > lastPublishedMap[p.author_id]) {
      lastPublishedMap[p.author_id] = p.published_at
    }
  }

  const authors = (profileRows ?? [])
    .map((p: any) => ({
      ...p,
      role: roleMap[p.id] ?? 'contributor',
      post_count: postCountMap[p.id] ?? 0,
      last_published_at: lastPublishedMap[p.id] ?? null,
    }))
    .sort((a: any, b: any) => {
      if (a.id === site.owner_id) return -1
      if (b.id === site.owner_id) return 1
      if (!a.last_published_at) return 1
      if (!b.last_published_at) return -1
      return a.last_published_at > b.last_published_at ? -1 : 1
    })

  // Keep safeAuthor for backward compat on /blog/:slug route
  const safeAuthor = (profileRows ?? []).find((p: any) => p.id === site.owner_id) ?? {
    id: site.owner_id,
    username: 'unknown',
    display_name: null,
    avatar_url: null,
    bio: null,
  }

  // ── Route: /blog ──────────────────────────────────────────────
  if (path === '/blog' || path === '/blog/') {
    const [{ data: posts }, { data: categories }] = await Promise.all([
      supabase
        .from('spur_posts')
        .select(
          'id, site_id, author_id, category_id, discovery_category_id, is_in_discovery, title, slug, excerpt, content, thumbnail_url, ' +
          'status, tags, content_meta, published_at, created_at, updated_at, ' +
          'serial_id, serial_index, is_serial'
        )
        .eq('site_id', site.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false }),

      supabase
        .from('spur_categories')
        .select('id, name, color, slug')
        .eq('site_id', site.id)
        .order('name', { ascending: true }),
    ])

    const postList = posts ?? []
    const discoveryIds = [...new Set(
      postList
        .map((p: any) => p.discovery_category_id)
        .filter(Boolean)
    )]

    let discoveryMap: Record<string, any> = {}

    if (discoveryIds.length) {
      const { data: discoveryRows } = await supabase
        .from('spur_discovery_categories')
        .select('id, name, slug, description, sort_order, is_active, created_at, parent_id')
        .in('id', discoveryIds)

      const parentIds = [...new Set(
        (discoveryRows ?? [])
          .map((row: any) => row.parent_id)
          .filter(Boolean)
      )]

      let parentMap: Record<string, any> = {}

      if (parentIds.length) {
        const { data: parentRows } = await supabase
          .from('spur_discovery_categories')
          .select('id, name, slug')
          .in('id', parentIds)

        parentMap = Object.fromEntries((parentRows ?? []).map((row: any) => [row.id, row]))
      }

      discoveryMap = Object.fromEntries(
        (discoveryRows ?? []).map((row: any) => [
          row.id,
          {
            ...row,
            parent: row.parent_id ? parentMap[row.parent_id] ?? null : null,
          }
        ])
      )
    }

    const postIds = postList.map((p: any) => p.id)
    const { counts, liked } = postIds.length
      ? await getLikesForEntities(supabase, 'spur_post', postIds, userId)
      : { counts: {}, liked: {} }

    const commentCounts = postIds.length
      ? await getCommentCountsForEntities(supabase, 'spur_post', postIds)
      : {}

    // ── Attach serial summaries to posts ──────────────────────
    const serialIds = [...new Set(postList.map((p: any) => p.serial_id).filter(Boolean))]
    let serialMap: Record<string, any> = {}

    if (serialIds.length) {
      const { data: serialRows } = await supabase
        .from('spur_serials')
        .select('id, title, slug, unit_label, status')
        .in('id', serialIds)

      serialMap = Object.fromEntries((serialRows ?? []).map((s: any) => [s.id, s]))
    }

    const postsWithLikes = postList.map((p: any) => ({
      ...p,
      like_count: counts[p.id] ?? 0,
      user_liked: liked[p.id] ?? false,
      comment_count: commentCounts[p.id] ?? 0,
      discovery: p.discovery_category_id ? discoveryMap[p.discovery_category_id] ?? null : null,
      serial: p.serial_id ? serialMap[p.serial_id] ?? null : null,
    }))

    return json({
      type: 'blog_index',
      site,
      posts: postsWithLikes,
      authors,
      categories: categories ?? [],
    })
  }

  // ── Route: /serial/:slug ──────────────────────────────────────
  const serialSlugMatch = path.match(/^\/blog\/serial\/([^/]+)\/?$/)
  if (serialSlugMatch) {
    const slug = serialSlugMatch[1]

    const { data: serial } = await supabase
      .from('spur_serials')
      .select('id, title, slug, tagline, description, cover_image_url, unit_label, status, created_at, updated_at')
      .eq('site_id', site.id)
      .eq('slug', slug)
      .maybeSingle()

    if (!serial) return json({ type: 'not_found' })

    const { data: chapters } = await supabase
      .from('spur_posts')
      .select('id, slug, title, content, serial_index, published_at, excerpt')
      .eq('serial_id', serial.id)
      .eq('status', 'published')
      .order('serial_index', { ascending: true })

    return json({
      type: 'serial_page',
      site,
      serial,
      chapters: chapters ?? [],
    })
  }

  // ── Route: /blog/:slug ────────────────────────────────────────
  const blogSlugMatch = path.match(/^\/blog\/([^/]+)\/?$/)
  if (blogSlugMatch) {
    const slug = blogSlugMatch[1]
    const { data: post } = await supabase
      .from('spur_posts')
      .select(
        'id, site_id, author_id, category_id, discovery_category_id, is_in_discovery, title, slug, excerpt, content, thumbnail_url, ' +
        'status, tags, content_meta, published_at, created_at, updated_at, ' +
        'serial_id, serial_index, is_serial'
      )
      .eq('site_id', site.id)
      .eq('slug', slug)
      .maybeSingle()

    if (!post) return json({ type: 'not_found' })

    let serial = null
    let toc = null
    let prev = null
    let next = null

    let discovery = null

    if (post.is_in_discovery && post.discovery_category_id) {
      const { data: discoveryCategory } = await supabase
        .from('spur_discovery_categories')
        .select('id, name, slug, description, sort_order, is_active, created_at, parent_id')
        .eq('id', post.discovery_category_id)
        .maybeSingle()

      if (discoveryCategory) {
        let parent = null

        if (discoveryCategory.parent_id) {
          const { data: parentRow } = await supabase
            .from('spur_discovery_categories')
            .select('id, name, slug')
            .eq('id', discoveryCategory.parent_id)
            .maybeSingle()

          parent = parentRow ?? null
        }

        discovery = {
          ...discoveryCategory,
          parent,
        }
      }
    }

    if (post.serial_id) {
      const { data: serialRow } = await supabase
        .from('spur_serials')
        .select('id, title, slug, description, cover_image_url, unit_label, status')
        .eq('id', post.serial_id)
        .maybeSingle()

      serial = serialRow ?? null

      const { data: chapters } = await supabase
        .from('spur_posts')
        .select('id, title, slug, serial_index, published_at')
        .eq('serial_id', post.serial_id)
        .eq('status', 'published')
        .order('serial_index', { ascending: true })

      toc = chapters ?? []

      if (post.serial_index != null) {
        const { data: prevRow } = await supabase
          .from('spur_posts')
          .select('slug')
          .eq('serial_id', post.serial_id)
          .eq('serial_index', post.serial_index - 1)
          .maybeSingle()

        const { data: nextRow } = await supabase
          .from('spur_posts')
          .select('slug')
          .eq('serial_id', post.serial_id)
          .eq('serial_index', post.serial_index + 1)
          .maybeSingle()

        prev = prevRow ?? null
        next = nextRow ?? null
      }
    }

    // Fetch post author
    let postAuthor = safeAuthor
    if (post.author_id !== site.owner_id) {
      const { data: pa } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .eq('id', post.author_id)
        .maybeSingle()
      if (pa) postAuthor = pa
    }

    const { counts, liked } = await getLikesForEntities(supabase, 'spur_post', [post.id], userId)

    const commentCounts = await getCommentCountsForEntities(supabase, 'spur_post', [post.id])

    const postWithLikes = {
      ...post,
      like_count: counts[post.id] ?? 0,
      user_liked: liked[post.id] ?? false,
      comment_count: commentCounts[post.id] ?? 0,
      discovery,
    }

    return json({
      type: 'blog_post',
      site,
      post: postWithLikes,
      author: postAuthor,
      serial,
      toc,
      prev,
      next,
    })
  }

  // ── Fallback ──────────────────────────────────────────────────
  return json({ type: 'not_found' })
})