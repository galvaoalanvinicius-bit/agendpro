'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

type Professional = {
  id: string
  name: string
  slug: string
  is_blocked: boolean
  created_at: string
  owner_id: string
}

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [stats, setStats] = useState({ totalProfessionals: 0, activeProfessionals: 0, totalAppointments: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!profile || profile.role !== 'admin_master') { router.replace('/dashboard'); return }
      loadData()
    }
  }, [authLoading, profile])

  async function loadData() {
    setLoading(true)
    const [companiesRes, appointmentsRes] = await Promise.all([
      supabase.from('companies').select('*, subscriptions(status), profiles!companies_owner_id_fkey(name)').order('created_at', { ascending: false }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
    ])
    const companies = companiesRes.data || []
    const active = companies.filter((c: any) => c.subscriptions?.[0]?.status === 'active')
    setProfessionals(companies as Professional[])
    setStats({ totalProfessionals: companies.length, activeProfessionals: active.length, totalAppointments: appointmentsRes.count || 0 })
    setLoading(false)
  }

  async function toggleBlock(company: Professional) {
    await supabase.from('companies').update({ is_blocked: !company.is_blocked }).eq('id', company.id)
    loadData()
  }

  const filtered = professionals.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  if (authLoading || loading) {
    return (
      <div style={styles.screen}>
        <div style={styles.spinner} />
        <p style={{ color: '#aaa', marginTop: 16 }}>Carregando painel admin...</p>
      </div>
    )
  }

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.logoText}>
          <span style={{ color: '#7c3aed' }}>Agend</span>
          <span style={{ color: '#06b6d4' }}>Pro</span>
          <span style={{ color: '#f59e0b', fontSize: 12, marginLeft: 8, fontWeight: 400 }}>Admin</span>
        </div>
        <button style={styles.logoutBtn} onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}>Sair</button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>Painel Administrativo</h2>

        <div style={styles.statsRow}>
          <div style={styles.statCard}><p style={styles.statLabel}>Profissionais</p><p style={styles.statValue}>{stats.totalProfessionals}</p><p style={styles.statSub}>cadastrados</p></div>
          <div style={styles.statCard}><p style={styles.statLabel}>Ativos</p><p style={{ ...styles.statValue, color: '#22c55e' }}>{stats.activeProfessionals}</p><p style={styles.statSub}>com assinatura ativa</p></div>
          <div style={styles.statCard}><p style={styles.statLabel}>Agendamentos</p><p style={styles.statValue}>{stats.totalAppointments}</p><p style={styles.statSub}>total na plataforma</p></div>
          <div style={styles.statCard}><p style={styles.statLabel}>MRR Estimado</p><p style={{ ...styles.statValue, color: '#06b6d4' }}>R$ {(stats.activeProfessionals * 39.9).toFixed(2)}</p><p style={styles.statSub}>receita mensal</p></div>
        </div>

        <input style={{ ...styles.input, maxWidth: 320, marginBottom: 20 }} placeholder="Buscar profissional..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 2 }}>Profissional</span>
            <span style={{ flex: 2 }}>Link</span>
            <span style={{ flex: 1 }}>Assinatura</span>
            <span style={{ flex: 1 }}>Status</span>
            <span style={{ flex: 1 }}>Cadastro</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Ação</span>
          </div>

          {filtered.length === 0 && <p style={styles.emptyText}>Nenhum profissional encontrado.</p>}

          {filtered.map((p) => {
            const subStatus = (p as any).subscriptions?.[0]?.status || 'inactive'
            const isActive = subStatus === 'active'
            return (
              <div key={p.id} style={styles.tableRow}>
                <div style={{ flex: 2 }}>
                  <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{p.name}</p>
                  <p style={{ color: '#666', fontSize: 12, margin: 0 }}>{(p as any).profiles?.name || ''}</p>
                </div>
                <div style={{ flex: 2 }}>
                  <p style={{ color: '#888', fontSize: 12, margin: 0 }}>/agendar/{p.slug || '—'}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ ...styles.badge, borderColor: isActive ? '#22c55e' : '#f87171', color: isActive ? '#22c55e' : '#f87171' }}>
                    {isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ ...styles.badge, borderColor: p.is_blocked ? '#f87171' : '#22c55e', color: p.is_blocked ? '#f87171' : '#22c55e' }}>
                    {p.is_blocked ? 'Bloqueado' : 'Ativo'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#888', fontSize: 12, margin: 0 }}>{format(new Date(p.created_at), 'dd/MM/yyyy')}</p>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ ...styles.smallBtn, color: p.is_blocked ? '#22c55e' : '#f87171' }} onClick={() => toggleBlock(p)}>
                    {p.is_blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, any> = {
  screen: { minHeight: '100vh', background: '#05070d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff' },
  app: { minHeight: '100vh', background: '#05070d', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0b0f1a' },
  logoText: { fontSize: 20, fontWeight: 700, letterSpacing: 1 },
  logoutBtn: { padding: '8px 16px', borderRadius: 10, border: 'none', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer', fontSize: 13 },
  content: { padding: '40px', maxWidth: 1200, margin: '0 auto' },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 24 },
  statsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginBottom: 32 },
  statCard: { background: '#0b0f1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px', minWidth: 150, flex: 1 },
  statLabel: { color: '#888', fontSize: 12, margin: '0 0 4px 0', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  statValue: { color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 },
  statSub: { color: '#666', fontSize: 11, margin: '2px 0 0 0' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  tableCard: { background: '#0b0f1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#888', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 0.5, gap: 16 },
  tableRow: { display: 'flex', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const },
  badge: { padding: '2px 10px', borderRadius: 20, border: '1px solid', fontSize: 11, fontWeight: 600 },
  smallBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 12, padding: '6px 12px' },
  spinner: { width: 48, height: 48, border: '4px solid #1e293b', borderTop: '4px solid #7c3aed', borderRadius: '50%' },
  emptyText: { color: '#555', textAlign: 'center' as const, padding: '32px 0' },
}