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

      const mpRes = await fetch(
        `https://api.mercadopago.com/preapproval/${id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}`,
          },
        }
      )

      const data = await mpRes.json()

      const userId = data.external_reference
      const isActive = data.status === 'authorized'

      if (!userId) {
        return NextResponse.json({ error: "missing userId" }, { status: 400 })
      }

      // 🔥 atualiza usuário
      await supabase
        .from('users')
        .update({ paid: isActive })
        .eq('id', userId)

      // 🔥 log assinatura
      await supabase.from('subscriptions').upsert({
        mp_preapproval_id: id,
        status: isActive ? 'active' : 'inactive',
        company_id: userId,
      })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    return NextResponse.json({ error: 'webhook error' }, { status: 500 })
  }
}