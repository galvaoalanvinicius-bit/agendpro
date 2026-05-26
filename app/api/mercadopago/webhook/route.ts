import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const type = body.type || body.topic

    if (type === 'preapproval' || type === 'subscription_preapproval') {
      const id = body.data?.id
      if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}` },
      })
      if (!mpRes.ok) return NextResponse.json({ error: 'mp api error' }, { status: 500 })

      const data = await mpRes.json()
      const ownerId = data.external_reference
      const isActive = data.status === 'authorized'

      if (!ownerId) return NextResponse.json({ error: 'missing external_reference' }, { status: 400 })

      const { data: company, error: companyError } = await supabase
        .from('companies').select('id').eq('owner_id', ownerId).single()

      if (companyError || !company) return NextResponse.json({ error: 'company not found' }, { status: 404 })

      await supabase.from('subscriptions').upsert(
        { company_id: company.id, mp_preapproval_id: id, status: isActive ? 'active' : 'inactive', updated_at: new Date().toISOString() },
        { onConflict: 'company_id' }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'webhook error' }, { status: 500 })
  }
}