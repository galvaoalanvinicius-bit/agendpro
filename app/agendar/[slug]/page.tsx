'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Company = {
  id: string
  name: string
  description: string | null
  slug: string
}

type Service = {
  id: string
  name: string
  duration: number
  price: number
  description: string | null
  color: string
}

type WorkingHour = {
  day_of_week: number
  start_time: string
  end_time: string
  lunch_start: string | null
  lunch_end: string | null
  interval_minutes: number
  is_active: boolean
}

type Step = 'servico' | 'data' | 'horario' | 'dados' | 'confirmado'

const DAYS_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function AgendarPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  const [company, setCompany] = useState<Company | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([])
  const [blockedDays, setBlockedDays] = useState<string[]>([])

  const [step, setStep] = useState<Step>('servico')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCompany()
  }, [slug])

  async function loadCompany() {
    setLoading(true)

    const { data: comp, error: compError } = await supabase
      .from('companies')
      .select('id, name, description, slug')
      .eq('slug', slug)
      .eq('is_blocked', false)
      .single()

    if (compError || !comp) {
      setError('Profissional não encontrado ou indisponível.')
      setLoading(false)
      return
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('company_id', comp.id)
      .single()

    if (!sub || sub.status !== 'active') {
      setError('Este profissional não está aceitando agendamentos no momento.')
      setLoading(false)
      return
    }

    setCompany(comp)

    const [servicesRes, workingRes, blockedRes] = await Promise.all([
      supabase.from('services').select('id, name, duration, price, description, color').eq('company_id', comp.id).order('name'),
      supabase.from('working_hours').select('*').eq('company_id', comp.id).eq('is_active', true),
      supabase.from('blocked_days').select('blocked_date').eq('company_id', comp.id),
    ])

    setServices(servicesRes.data || [])
    setWorkingHours(workingRes.data || [])

    const blocked = (blockedRes.data || []).map((b: any) => b.blocked_date)
    setBlockedDays(blocked)

    const activeDays = (workingRes.data || [])
      .filter((w: WorkingHour) => w.is_active)
      .map((w: WorkingHour) => w.day_of_week)

    const dates: Date[] = []
    const today = startOfDay(new Date())

    for (let i = 1; i <= 60 && dates.length < 30; i++) {
      const d = addDays(today, i)
      const dow = d.getDay()
      const dateStr = format(d, 'yyyy-MM-dd')
      if (activeDays.includes(dow) && !blocked.includes(dateStr)) {
        dates.push(d)
      }
    }

    setAvailableDates(dates)
    setLoading(false)
  }

  async function loadAvailableTimes(date: Date, service: Service) {
    if (!company) return

    const dow = date.getDay()
    const wh = workingHours.find((w) => w.day_of_week === dow && w.is_active)

    if (!wh) { setAvailableTimes([]); return }

    const slots = generateSlots(
      wh.start_time, wh.end_time,
      wh.lunch_start, wh.lunch_end,
      wh.interval_minutes, service.duration
    )

    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)

    const { data: existing } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('company_id', company.id)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled')

    const occupied = existing || []

    const free = slots.filter((slot) => {
      const slotStart = new Date(date)
      const [h, m] = slot.split(':')
      slotStart.setHours(Number(h), Number(m), 0, 0)
      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + service.duration)

      return !occupied.some((appt: any) => {
        const apptStart = new Date(appt.start_time)
        const apptEnd = new Date(appt.end_time)
        return slotStart < apptEnd && slotEnd > apptStart
      })
    })

    setAvailableTimes(free)
  }

  function generateSlots(
    startTime: string, endTime: string,
    lunchStart: string | null, lunchEnd: string | null,
    intervalMinutes: number, serviceDuration: number
  ): string[] {
    const slots: string[] = []
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startTotal = sh * 60 + sm
    const endTotal = eh * 60 + em

    let lunchStartTotal = -1, lunchEndTotal = -1
    if (lunchStart && lunchEnd) {
      const [lsh, lsm] = lunchStart.split(':').map(Number)
      const [leh, lem] = lunchEnd.split(':').map(Number)
      lunchStartTotal = lsh * 60 + lsm
      lunchEndTotal = leh * 60 + lem
    }

    let current = startTotal
    while (current + serviceDuration <= endTotal) {
      const slotEnd = current + serviceDuration
      const inLunch = lunchStartTotal >= 0 && current < lunchEndTotal && slotEnd > lunchStartTotal
      if (!inLunch) {
        const hh = Math.floor(current / 60).toString().padStart(2, '0')
        const mm = (current % 60).toString().padStart(2, '0')
        slots.push(`${hh}:${mm}`)
      }
      current += intervalMinutes
    }
    return slots
  }

  async function handleConfirm() {
    if (!company || !selectedService || !selectedDate || !selectedTime) return
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Preencha seu nome e telefone')
      return
    }

    setSaving(true)

    const start = new Date(selectedDate)
    const [h, m] = selectedTime.split(':')
    start.setHours(Number(h), Number(m), 0, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + selectedService.duration)

    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('company_id', company.id)
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString())
      .neq('status', 'cancelled')

    if (conflict && conflict.length > 0) {
      alert('Este horário acabou de ser ocupado. Escolha outro.')
      setSaving(false)
      await loadAvailableTimes(selectedDate, selectedService)
      setStep('horario')
      return
    }

    const { error: insertError } = await supabase.from('appointments').insert({
      company_id: company.id,
      service_id: selectedService.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'confirmed',
    })

    setSaving(false)
    if (insertError) { alert('Erro ao criar agendamento. Tente novamente.'); return }
    setStep('confirmado')
  }

  function isStepDone(current: Step, check: Step): boolean {
    const order: Step[] = ['servico', 'data', 'horario', 'dados', 'confirmado']
    return order.indexOf(current) > order.indexOf(check)
  }

  if (loading) {
    return (
      <div style={styles.screen}>
        <div style={styles.spinner} />
        <p style={{ color: '#aaa', marginTop: 16 }}>Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <h2 style={{ color: '#f87171', marginBottom: 8 }}>Indisponível</h2>
          <p style={{ color: '#aaa' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!company) return null

  if (step === 'confirmado') {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ color: '#fff', marginBottom: 8 }}>Agendamento confirmado!</h2>
          <p style={{ color: '#aaa', marginBottom: 4 }}><b style={{ color: '#fff' }}>{selectedService?.name}</b></p>
          <p style={{ color: '#aaa', marginBottom: 4 }}>
            {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}
          </p>
          <p style={{ color: '#aaa', marginBottom: 20 }}>
            Profissional: <b style={{ color: '#fff' }}>{company.name}</b>
          </p>
          <button style={styles.btnPrimary} onClick={() => {
            setStep('servico'); setSelectedService(null); setSelectedDate(null)
            setSelectedTime(null); setClientName(''); setClientPhone('')
          }}>
            Fazer outro agendamento
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={styles.logo}>
            <span style={{ color: '#7c3aed', fontWeight: 700 }}>Agend</span>
            <span style={{ color: '#06b6d4' }}>Pro</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 20, margin: '8px 0 4px' }}>{company.name}</h1>
          {company.description && <p style={{ color: '#888', fontSize: 13 }}>{company.description}</p>}
        </div>

        <div style={styles.stepsRow}>
          {(['servico', 'data', 'horario', 'dados'] as Step[]).map((s) => (
            <div key={s} style={styles.stepDot(step === s || isStepDone(step, s))} />
          ))}
        </div>

        {step === 'servico' && (
          <div>
            <h3 style={styles.stepTitle}>Escolha o serviço</h3>
            {services.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>Nenhum serviço disponível.</p>}
            {services.map((s) => (
              <button key={s.id} style={{ ...styles.serviceCard, borderColor: selectedService?.id === s.id ? s.color : 'rgba(255,255,255,0.08)' }}
                onClick={() => { setSelectedService(s); setStep('data') }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ ...styles.colorDot, background: s.color }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{s.name}</div>
                    {s.description && <div style={{ color: '#888', fontSize: 12 }}>{s.description}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#aaa', fontSize: 13 }}>{s.duration} min</div>
                  {s.price > 0 && <div style={{ color: '#06b6d4', fontSize: 13, fontWeight: 600 }}>R$ {s.price.toFixed(2)}</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'data' && (
          <div>
            <button style={styles.backBtn} onClick={() => setStep('servico')}>← Voltar</button>
            <h3 style={styles.stepTitle}>Escolha a data</h3>
            <div style={styles.datesGrid}>
              {availableDates.map((d) => (
                <button key={d.toISOString()}
                  style={{ ...styles.dateBtn, background: selectedDate?.toDateString() === d.toDateString() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.05)', borderColor: selectedDate?.toDateString() === d.toDateString() ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}
                  onClick={async () => { setSelectedDate(d); setSelectedTime(null); await loadAvailableTimes(d, selectedService!); setStep('horario') }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{DAYS_LABEL[d.getDay()]}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{format(d, 'dd')}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{format(d, 'MMM', { locale: ptBR })}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'horario' && (
          <div>
            <button style={styles.backBtn} onClick={() => setStep('data')}>← Voltar</button>
            <h3 style={styles.stepTitle}>Horários disponíveis — {selectedDate && format(selectedDate, "dd/MM")}</h3>
            {availableTimes.length === 0 && <p style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>Nenhum horário disponível para este dia.</p>}
            <div style={styles.timesGrid}>
              {availableTimes.map((t) => (
                <button key={t}
                  style={{ ...styles.timeBtn, background: selectedTime === t ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.05)', borderColor: selectedTime === t ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => { setSelectedTime(t); setStep('dados') }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'dados' && (
          <div>
            <button style={styles.backBtn} onClick={() => setStep('horario')}>← Voltar</button>
            <h3 style={styles.stepTitle}>Seus dados</h3>
            <div style={styles.summaryBox}>
              <p style={styles.summaryLine}><span style={{ color: '#888' }}>Serviço:</span> <span style={{ color: '#fff' }}>{selectedService?.name}</span></p>
              <p style={styles.summaryLine}><span style={{ color: '#888' }}>Data:</span> <span style={{ color: '#fff' }}>{selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime}</span></p>
              <p style={styles.summaryLine}><span style={{ color: '#888' }}>Duração:</span> <span style={{ color: '#fff' }}>{selectedService?.duration} min</span></p>
            </div>
            <input style={styles.input} placeholder="Seu nome completo" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            <input style={styles.input} placeholder="WhatsApp (ex: 11999999999)" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} type="tel" />
            <button style={{ ...styles.btnPrimary, marginTop: 16 }} onClick={handleConfirm} disabled={saving}>
              {saving ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, any> = {
  screen: { minHeight: '100vh', background: 'radial-gradient(circle at top, #0a0f1f, #05070d)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px' },
  card: { background: '#0b0f1a', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 480, boxShadow: '0 0 60px rgba(124,58,237,0.2)' },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: 1 },
  spinner: { width: 48, height: 48, border: '4px solid #1e293b', borderTop: '4px solid #7c3aed', borderRadius: '50%' },
  stepsRow: { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 },
  stepDot: (active: boolean) => ({ width: 8, height: 8, borderRadius: '50%', background: active ? '#7c3aed' : 'rgba(255,255,255,0.15)', transition: '0.3s' }),
  stepTitle: { color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 4 },
  serviceCard: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' },
  colorDot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 },
  datesGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginTop: 8 },
  dateBtn: { width: 64, padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center' as const, transition: '0.2s', color: '#fff' },
  timesGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginTop: 8 },
  timeBtn: { padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600, transition: '0.2s' },
  input: { width: '100%', marginBottom: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  btnPrimary: { width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: '0.3s' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 0 12px 0', fontSize: 13 },
  summaryBox: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 },
  summaryLine: { margin: '4px 0', fontSize: 14 },
}