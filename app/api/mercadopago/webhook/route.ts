import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log('Webhook recebido:', body)

    const type = body.type || body.topic

    // =========================
    // ASSINATURA
    // =========================
    if (type === 'subscription_preapproval' || type === 'preapproval') {

      const subscriptionId = body.data?.id

      if (!subscriptionId) {
        return NextResponse.json({ ok: false })
      }

      // consulta Mercado Pago
      const res = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}`
          }
        }
      )

      const data = await res.json()

      const status = data.status // authorized / cancelled / paused
      const external_reference = data.external_reference

      console.log('MP STATUS:', status)

      // =========================
      // ATUALIZA BANCO
      // =========================
      await supabase
        .from('subscriptions')
        .update({
          status: status === 'authorized' ? 'active' : 'inactive',
          mp_preapproval_id: subscriptionId,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', external_reference)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'webhook error' }, { status: 500 })
  }
}
