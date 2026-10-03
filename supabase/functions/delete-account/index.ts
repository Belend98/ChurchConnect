import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        Allow: 'POST, OPTIONS',
      },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Configuration serveur incomplète.' }, 500)
    }

    const supabaseUser = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: activeSession, error: sessionError } = await supabaseUser.rpc('is_active_account_session')
    if (sessionError) {
      return jsonResponse({ error: 'Impossible de vérifier votre session.' }, 500)
    }
    if (activeSession !== true) {
      return jsonResponse({ error: 'Session révoquée ou compte désactivé.' }, 401)
    }

    const bodyText = await req.text()
    let body: unknown = {}
    try {
      if (bodyText.trim()) body = JSON.parse(bodyText)
    } catch {
      return jsonResponse({ error: 'Requête invalide.' }, 400)
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Requête invalide.' }, 400)
    }
    const targetId = 'userId' in body ? body.userId : user.id
    if (typeof targetId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      return jsonResponse({ error: 'Identifiant de compte invalide.' }, 400)
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    let actorRole: string | undefined
    if (targetId !== user.id) {
      const { data: actor, error: actorError } = await supabaseAdmin
        .from('user_profil')
        .select('role_app')
        .eq('id', user.id)
        .maybeSingle()
      if (actorError) {
        return jsonResponse({ error: 'Impossible de vérifier vos permissions.' }, 500)
      }
      actorRole = actor?.role_app
      if (actorRole !== 'pasteur' && actorRole !== 'admin') {
        return jsonResponse({ error: 'Seuls le pasteur et les administrateurs peuvent supprimer un autre compte.' }, 403)
      }
    }

    const { data: target, error: targetError } = await supabaseAdmin.auth.admin.getUserById(targetId)
    if (targetError || !target.user) {
      return jsonResponse({ error: 'Compte introuvable.' }, targetError?.status === 404 ? 404 : 500)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profil')
      .select('image_url, role_app')
      .eq('id', targetId)
      .maybeSingle()
    if (profileError) {
      return jsonResponse({ error: 'Impossible de récupérer le profil.' }, 500)
    }

    if (profile?.role_app === 'pasteur') {
      return jsonResponse({ error: 'Le compte pasteur ne peut pas être supprimé : l’application ne peut pas rester sans pasteur. Pour ce changement critique, contactez le développeur.' }, 403)
    }
    if (targetId !== user.id && actorRole === 'admin' && profile?.role_app !== 'membre') {
      return jsonResponse({ error: 'Un administrateur peut uniquement supprimer les comptes membres.' }, 403)
    }

    let imageBucket = Deno.env.get('SUPABASE_IMAGE_BUCKET') ?? 'church-images'
    if (profile?.image_url) {
      const imageUrl = new URL(profile.image_url)
      const storagePrefix = '/storage/v1/object/public/'
      const [bucket, ...segments] = decodeURIComponent(imageUrl.pathname.slice(storagePrefix.length)).split('/')
      if (imageUrl.origin !== new URL(url).origin || !imageUrl.pathname.startsWith(storagePrefix) || !bucket || !segments.join('/').startsWith(`profiles/${targetId}/`)) {
        return jsonResponse({ error: 'Chemin de photo de profil invalide.' }, 500)
      }
      imageBucket = bucket
    }
    const folder = `profiles/${targetId}`
    const imagePaths: string[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data: images, error: listError } = await supabaseAdmin.storage
        .from(imageBucket)
        .list(folder, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
      if (listError) {
        return jsonResponse({ error: 'Impossible de récupérer les photos du compte.' }, 500)
      }
      if (images.some((image) => !image.id || image.name.includes('/') || image.name.includes('\\') || image.name === '.' || image.name === '..')) {
        return jsonResponse({ error: 'Contenu du dossier de profil invalide.' }, 500)
      }
      imagePaths.push(...images.map((image) => `${folder}/${image.name}`))
      if (images.length < 1000) break
    }

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      targetId,
      { ban_duration: '876000h' },
    )
    if (banError) {
      return jsonResponse({ error: 'Impossible de bloquer les connexions du compte.' }, 500)
    }
    const { error: revokeError } = await supabaseAdmin.rpc(
      'revoke_account_sessions',
      { target_user_id: targetId },
    )
    if (revokeError) {
      return jsonResponse({ error: 'Impossible de révoquer les sessions du compte.' }, 500)
    }

    for (let offset = 0; offset < imagePaths.length; offset += 1000) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(imageBucket)
        .remove(imagePaths.slice(offset, offset + 1000))
      if (storageError) {
        return jsonResponse({ error: 'Impossible de supprimer les photos du compte.' }, 500)
      }
    }

    const { error: ownershipError } = await supabaseAdmin.rpc(
      'detach_account_storage_ownership',
      { target_user_id: targetId },
    )
    if (ownershipError) {
      return jsonResponse({ error: 'Impossible de préparer la suppression du compte.' }, 500)
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      targetId,
      false,
    )
    if (deleteError) {
      console.error('delete-account: Auth deletion failed', deleteError.message)
      return jsonResponse({ error: 'Impossible de supprimer le compte.' }, 500)
    }

    return jsonResponse({ success: true }, 200)
  } catch {
    return jsonResponse({ error: 'Erreur interne lors de la suppression du compte.' }, 500)
  }
}

export default { fetch: handleRequest }
