import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { importSinapi } from '@/lib/sinapi/importer'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_BYTES = 50 * 1024 * 1024

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  const bearer = authHeader?.replace(/^Bearer\s+/i, '')
  if (!bearer) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) {
    return NextResponse.json({ error: 'MISCONFIGURED' }, { status: 500 })
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const { data: profile, error: profErr } = await userClient
    .from('users')
    .select('id, is_super_admin')
    .eq('id', userData.user.id)
    .single()
  if (profErr || !profile?.is_super_admin) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const file = form.get('file')
  const estado = (form.get('estado') as string | null)?.toUpperCase().trim()
  const mes = (form.get('mes') as string | null)?.trim()
  const desoneradoRaw = form.get('desonerado')
  const desonerado = desoneradoRaw === 'true' || desoneradoRaw === '1' || desoneradoRaw === 'on'

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 })
  }
  if (!estado || !/^[A-Z]{2}$/.test(estado)) {
    return NextResponse.json({ error: 'ESTADO_INVALID' }, { status: 400 })
  }
  if (!mes || !/^\d{4}-\d{2}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: 'MES_INVALID (use YYYY-MM-DD)' }, { status: 400 })
  }

  const fileName = (file as File).name ?? 'upload.xlsx'
  const buffer = Buffer.from(await file.arrayBuffer())

  const serviceClient = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const result = await importSinapi(serviceClient, {
      fileBuffer: buffer,
      fileName,
      estado,
      mesReferencia: mes,
      desonerado,
      importedBy: profile.id,
    })
    return NextResponse.json(result, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
