'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Appointment = {
  id: string
  client_name: string
  client_phone: string
  start_time: string
  end_time: string
  status: string
  services?: { name: string; price: number; color: string }
}

type Company = {
  id: string
  name: string
  slug: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [tab, setTab] = useState<'agenda' | 'servicos' | 'horarios' | 'relatorio'>('agenda')
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [nextAppointments, setNextAppointments] = useState<Appointment[]>([])
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([])
  const [totalClients, setTotalClients] = useState(0)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) initDashboard()
  }, [authLoading, user])

  async function initDashboard() {
    setLoading(true)

    // Busca o profile para verificar o role
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    // Se for admin_master, redireciona direto para o painel admin
    if (prof?.role === 'admin_master') {
      window.location.href = '/admin'
      return
    }

    const { data: comp } = await supabase
      .from('companies')
      .select('id, name, slug')
      .eq('owner_id', user!.id)
      .single()

    if (!comp) { setLoading(false); return }

    setCompany(comp)
    await loadStats(comp.id)
    setLoading(false)
  }

  async function loadStats(companyId: string) {
    const today = new Date()
    const dayStart = startOfDay(today).toISOString()
    const dayEnd = endOfDay(today).toISOString()
    const monthStart = startOfMonth(today).toISOString()
    const monthEnd = endOfMonth(today).toISOString()

    const { data: todayData } = await supabase
      .from('appointments').select('*, services(name, price, color)')
      .eq('company_id', companyId).gte('start_time', dayStart).lte('start_time', dayEnd)
      .neq('status', 'cancelled').order('start_time')
    setTodayAppointments(todayData || [])

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const { data: nextData } = await supabase
      .from('appointments').select('*, services(name, price, color)')
      .eq('company_id', companyId).gte('start_time', tomorrow.toISOString())
      .neq('status', 'cancelled').order('start_time').limit(10)
    setNextAppointments(nextData || [])

    const { data: monthData } = await supabase
      .from('appointments').select('*, services(name, price, color)')
      .eq('company_id', companyId).gte('start_time', monthStart).lte('start_time', monthEnd)
      .neq('status', 'cancelled')
    setMonthAppointments(monthData || [])

    const revenue = (monthData || []).reduce((acc: number, appt: any) => acc + (appt.services?.price || 0), 0)
    setMonthRevenue(revenue)

    const { count } = await supabase
      .from('appointments').select('client_name', { count: 'exact', head: true }).eq('company_id', companyId)
    setTotalClients(count || 0)
  }

  const publicLink = company
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/agendar/${company.slug}`
    : ''

  if (authLoading || loading) {
    return (
      <div style={styles.screen}>
        <div style={styles.spinner} />
        <p style={{ color: '#aaa', marginTop: 16 }}>Carregando painel...</p>
      </div>
    )
  }

  if (!company) {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <h2 style={{ color: '#f87171' }}>Empresa não encontrada</h2>
          <p style={{ color: '#888' }}>Contate o suporte.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoText}>
            <span style={{ color: '#7c3aed' }}>Agend</span>
            <span style={{ color: '#06b6d4' }}>Pro</span>
          </div>
          <p style={{ color: '#555', fontSize: 12, marginBottom: 24 }}>{company.name}</p>
          {(['agenda', 'servicos', 'horarios', 'relatorio'] as const).map((t) => (
            <button
              key={t}
              style={{ ...styles.navBtn, ...(tab === t ? styles.navBtnActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === 'agenda' && '📅 Agenda'}
              {t === 'servicos' && '✂️ Serviços'}
              {t === 'horarios' && '🕐 Horários'}
              {t === 'relatorio' && '📊 Relatório'}
            </button>
          ))}
        </div>
        <div>
          <div style={styles.linkBox}>
            <p style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Seu link de agendamento:</p>
            <p style={{ color: '#06b6d4', fontSize: 11, wordBreak: 'break-all' }}>
              /agendar/{company.slug}
            </p>
            <button
              style={styles.copyBtn}
              onClick={() => { navigator.clipboard.writeText(publicLink); alert('Link copiado!') }}
            >
              Copiar link
            </button>
          </div>
          <button
            style={styles.logoutBtn}
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {tab === 'agenda' && (
          <div>
            <h2 style={styles.pageTitle}>Agenda</h2>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Hoje</p>
                <p style={styles.statValue}>{todayAppointments.length}</p>
                <p style={styles.statSub}>agendamentos</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Este mês</p>
                <p style={styles.statValue}>{monthAppointments.length}</p>
                <p style={styles.statSub}>agendamentos</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Faturamento est.</p>
                <p style={{ ...styles.statValue, color: '#06b6d4' }}>R$ {monthRevenue.toFixed(2)}</p>
                <p style={styles.statSub}>este mês</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Total atend.</p>
                <p style={styles.statValue}>{totalClients}</p>
                <p style={styles.statSub}>registros</p>
              </div>
            </div>

            <h3 style={styles.sectionTitle}>
              Hoje — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            {todayAppointments.length === 0 && (
              <p style={styles.emptyText}>Nenhum agendamento para hoje.</p>
            )}
            {todayAppointments.map((a) => (
              <AppointmentCard key={a.id} appt={a} companyId={company.id} onRefresh={() => loadStats(company.id)} />
            ))}

            {nextAppointments.length > 0 && (
              <>
                <h3 style={{ ...styles.sectionTitle, marginTop: 32 }}>Próximos agendamentos</h3>
                {nextAppointments.map((a) => (
                  <AppointmentCard key={a.id} appt={a} companyId={company.id} onRefresh={() => loadStats(company.id)} />
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'servicos' && <ServicesPanel companyId={company.id} />}
        {tab === 'horarios' && <WorkingHoursPanel companyId={company.id} />}

        {tab === 'relatorio' && (
          <div>
            <h2 style={styles.pageTitle}>Relatório do Mês</h2>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Agendamentos</p>
                <p style={styles.statValue}>{monthAppointments.length}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Faturamento Estimado</p>
                <p style={{ ...styles.statValue, color: '#06b6d4' }}>R$ {monthRevenue.toFixed(2)}</p>
              </div>
            </div>
            <h3 style={styles.sectionTitle}>Agendamentos do mês</h3>
            {monthAppointments.length === 0 && (
              <p style={styles.emptyText}>Nenhum agendamento este mês.</p>
            )}
            {monthAppointments.map((a) => (
              <div key={a.id} style={styles.apptCard}>
                <div>
                  <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{a.client_name}</p>
                  <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                    {format(new Date(a.start_time), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#06b6d4', fontSize: 13, margin: 0, fontWeight: 600 }}>
                    {(a as any).services?.name}
                  </p>
                  <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                    R$ {((a as any).services?.price || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ============================================================
// SUBCOMPONENTE: Card de Agendamento
// ============================================================
function AppointmentCard({
  appt,
  companyId,
  onRefresh,
}: {
  appt: Appointment
  companyId: string
  onRefresh: () => void
}) {
  const service = (appt as any).services
  const statusColor =
    appt.status === 'confirmed' ? '#22c55e' : appt.status === 'completed' ? '#06b6d4' : '#f87171'

  async function cancel() {
    if (!confirm('Cancelar este agendamento?')) return
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id)
    onRefresh()
  }

  async function complete() {
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', appt.id)
    onRefresh()
  }

  return (
    <div style={styles.apptCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {service && <div style={{ ...styles.colorDot, background: service.color }} />}
        <div>
          <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{appt.client_name}</p>
          <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
            {appt.client_phone} • {format(new Date(appt.start_time), 'HH:mm')} –{' '}
            {format(new Date(appt.end_time), 'HH:mm')}
          </p>
          {service && (
            <p style={{ color: service.color, fontSize: 12, margin: 0 }}>{service.name}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ ...styles.badge, borderColor: statusColor, color: statusColor }}>
          {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'completed' ? 'Concluído' : 'Cancelado'}
        </span>
        {appt.status === 'confirmed' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={styles.smallBtn} onClick={complete}>✓ Concluir</button>
            <button style={{ ...styles.smallBtn, color: '#f87171' }} onClick={cancel}>✕ Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SUBCOMPONENTE: Painel de Serviços
// ============================================================
function ServicesPanel({ companyId }: { companyId: string }) {
  const [services, setServices] = useState<any[]>([])
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#7c3aed')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  useEffect(() => { load() }, [companyId])

  async function load() {
    const { data } = await supabase
      .from('services').select('*').eq('company_id', companyId).order('name')
    setServices(data || [])
  }

  function reset() {
    setName(''); setDuration(''); setPrice(''); setDescription(''); setColor('#7c3aed'); setEditId(null)
  }

  async function save() {
    if (!name.trim() || !duration) return alert('Preencha nome e duração')
    const dur = Number(duration)
    if (isNaN(dur) || dur <= 0) return alert('Duração inválida')
    setSaving(true)
    const payload = {
      name: name.trim(), duration: dur, price: Number(price) || 0,
      description: description.trim(), color, company_id: companyId
    }
    if (editId) { await supabase.from('services').update(payload).eq('id', editId) }
    else { await supabase.from('services').insert(payload) }
    setSaving(false); reset(); load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este serviço?')) return
    await supabase.from('services').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Serviços</h2>
      <div style={styles.formCard}>
        <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 15 }}>
          {editId ? 'Editar serviço' : 'Novo serviço'}
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input style={{ ...styles.input, flex: 2, minWidth: 160 }} placeholder="Nome do serviço" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={{ ...styles.input, width: 90 }} placeholder="Min" value={duration} onChange={(e) => setDuration(e.target.value)} type="number" />
          <input style={{ ...styles.input, width: 100 }} placeholder="R$ Preço" value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" />
        </div>
        <input style={{ ...styles.input, marginTop: 10 }} placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: 13 }}>Cor:</span>
          {COLORS.map((c) => (
            <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid #fff' : '2px solid transparent' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button style={styles.btnPrimary} onClick={save} disabled={saving}>
            {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Criar serviço'}
          </button>
          {editId && <button style={styles.cancelBtn} onClick={reset}>Cancelar</button>}
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        {services.length === 0 && <p style={styles.emptyText}>Nenhum serviço cadastrado.</p>}
        {services.map((s) => (
          <div key={s.id} style={styles.apptCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ ...styles.colorDot, background: s.color }} />
              <div>
                <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{s.name}</p>
                <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                  {s.duration} min{s.price > 0 ? ` • R$ ${Number(s.price).toFixed(2)}` : ''}
                </p>
                {s.description && <p style={{ color: '#666', fontSize: 12, margin: 0 }}>{s.description}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.smallBtn} onClick={() => {
                setEditId(s.id); setName(s.name); setDuration(String(s.duration))
                setPrice(String(s.price || '')); setDescription(s.description || ''); setColor(s.color)
              }}>Editar</button>
              <button style={{ ...styles.smallBtn, color: '#f87171' }} onClick={() => remove(s.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// SUBCOMPONENTE: Painel de Horários
// ============================================================
function WorkingHoursPanel({ companyId }: { companyId: string }) {
  const [hours, setHours] = useState<any[]>([])
  const [blockedDays, setBlockedDays] = useState<any[]>([])
  const [newBlockDate, setNewBlockDate] = useState('')
  const [newBlockReason, setNewBlockReason] = useState('')
  const [saving, setSaving] = useState(false)
  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  useEffect(() => { load() }, [companyId])

  async function load() {
    const [hoursRes, blockedRes] = await Promise.all([
      supabase.from('working_hours').select('*').eq('company_id', companyId).order('day_of_week'),
      supabase.from('blocked_days').select('*').eq('company_id', companyId).order('blocked_date'),
    ])
    setHours(hoursRes.data || [])
    setBlockedDays(blockedRes.data || [])
  }

  async function toggleDay(dow: number, current: any) {
    if (current) {
      await supabase.from('working_hours').update({ is_active: !current.is_active }).eq('id', current.id)
    } else {
      await supabase.from('working_hours').insert({
        company_id: companyId, day_of_week: dow, start_time: '08:00',
        end_time: '18:00', lunch_start: '12:00', lunch_end: '13:00',
        interval_minutes: 30, is_active: true
      })
    }
    load()
  }

  async function updateHour(id: string, field: string, value: string) {
    await supabase.from('working_hours').update({ [field]: value }).eq('id', id)
  }

  async function addBlockedDay() {
    if (!newBlockDate) return alert('Selecione uma data')
    setSaving(true)
    await supabase.from('blocked_days').upsert({
      company_id: companyId, blocked_date: newBlockDate,
      reason: newBlockReason.trim() || null
    })
    setNewBlockDate(''); setNewBlockReason(''); setSaving(false); load()
  }

  async function removeBlockedDay(id: string) {
    await supabase.from('blocked_days').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Horários de Atendimento</h2>
      <div style={styles.formCard}>
        <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 15 }}>Dias da semana</h3>
        {DAYS.map((day, dow) => {
          const h = hours.find((x) => x.day_of_week === dow)
          const isActive = h?.is_active ?? false
          return (
            <div key={dow} style={styles.dayRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 120 }}>
                <div style={{ ...styles.toggle, background: isActive ? '#7c3aed' : '#333' }} onClick={() => toggleDay(dow, h)} />
                <span style={{ color: isActive ? '#fff' : '#555', fontWeight: 600 }}>{day}</span>
              </div>
              {isActive && h && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: 12 }}>Início:</span>
                    <input type="time" defaultValue={h.start_time} style={styles.timeInput} onBlur={(e) => updateHour(h.id, 'start_time', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: 12 }}>Fim:</span>
                    <input type="time" defaultValue={h.end_time} style={styles.timeInput} onBlur={(e) => updateHour(h.id, 'end_time', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: 12 }}>Almoço:</span>
                    <input type="time" defaultValue={h.lunch_start || ''} style={styles.timeInput} onBlur={(e) => updateHour(h.id, 'lunch_start', e.target.value)} />
                    <span style={{ color: '#666' }}>–</span>
                    <input type="time" defaultValue={h.lunch_end || ''} style={styles.timeInput} onBlur={(e) => updateHour(h.id, 'lunch_end', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: 12 }}>Intervalo:</span>
                    <select defaultValue={h.interval_minutes} style={{ ...styles.timeInput, width: 70 }} onChange={(e) => updateHour(h.id, 'interval_minutes', e.target.value)}>
                      {[15, 20, 30, 45, 60].map((v) => <option key={v} value={v}>{v} min</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ ...styles.formCard, marginTop: 20 }}>
        <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 15 }}>Dias Bloqueados</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <input type="date" style={{ ...styles.input, width: 160 }} value={newBlockDate} onChange={(e) => setNewBlockDate(e.target.value)} />
          <input style={{ ...styles.input, flex: 1, minWidth: 120 }} placeholder="Motivo (opcional)" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)} />
          <button style={styles.btnPrimary} onClick={addBlockedDay} disabled={saving}>Bloquear dia</button>
        </div>
        {blockedDays.length === 0 && <p style={styles.emptyText}>Nenhum dia bloqueado.</p>}
        {blockedDays.map((b) => (
          <div key={b.id} style={styles.apptCard}>
            <div>
              <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>
                {format(new Date(b.blocked_date + 'T12:00:00'), 'dd/MM/yyyy')}
              </p>
              {b.reason && <p style={{ color: '#888', fontSize: 12, margin: 0 }}>{b.reason}</p>}
            </div>
            <button style={{ ...styles.smallBtn, color: '#f87171' }} onClick={() => removeBlockedDay(b.id)}>Remover</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// STYLES
// ============================================================
const styles: Record<string, any> = {
  screen: { minHeight: '100vh', background: '#05070d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff' },
  app: { display: 'flex', minHeight: '100vh', background: '#05070d', color: '#fff' },
  sidebar: { width: 220, background: '#0b0f1a', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '28px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'sticky' as const, top: 0, height: '100vh' },
  logoText: { fontSize: 20, fontWeight: 700, marginBottom: 4, letterSpacing: 1 },
  navBtn: { width: '100%', textAlign: 'left' as const, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', marginBottom: 4, fontSize: 14, transition: '0.2s' },
  navBtnActive: { background: 'rgba(124,58,237,0.15)', color: '#fff' },
  linkBox: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, marginBottom: 12 },
  copyBtn: { marginTop: 8, width: '100%', padding: '6px', borderRadius: 8, border: '1px solid rgba(6,182,212,0.3)', background: 'transparent', color: '#06b6d4', cursor: 'pointer', fontSize: 12 },
  logoutBtn: { width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer', fontSize: 13 },
  main: { flex: 1, padding: '40px 36px', overflowY: 'auto' as const },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 24 },
  sectionTitle: { color: '#aaa', fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 1 },
  statsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginBottom: 32 },
  statCard: { background: '#0b0f1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px', minWidth: 140, flex: 1 },
  statLabel: { color: '#888', fontSize: 12, margin: '0 0 4px 0', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  statValue: { color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 },
  statSub: { color: '#666', fontSize: 11, margin: '2px 0 0 0' },
  apptCard: { background: '#0b0f1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 },
  badge: { padding: '2px 10px', borderRadius: 20, border: '1px solid', fontSize: 11, fontWeight: 600 },
  smallBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#aaa', cursor: 'pointer', fontSize: 12, padding: '4px 10px' },
  colorDot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 },
  spinner: { width: 48, height: 48, border: '4px solid #1e293b', borderTop: '4px solid #7c3aed', borderRadius: '50%' },
  card: { background: '#0b0f1a', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' as const },
  formCard: { background: '#0b0f1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' as const },
  cancelBtn: { padding: '10px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', fontSize: 14 },
  emptyText: { color: '#555', textAlign: 'center' as const, padding: '20px 0' },
  dayRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' as const },
  toggle: { width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0, transition: '0.3s' },
  timeInput: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', padding: '4px 8px', fontSize: 13, outline: 'none', width: 90 },
}