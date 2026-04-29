'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import CreateAppointmentModal from '@/components/CreateAppointmentModal'

type Appointment = {
  id: string
  client_name: string
  start_time: string
}

export default function Home() {
  const router = useRouter()

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setRedirecting(true)
      router.replace('/login')
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('onboarded')
      .eq('id', user.id)
      .maybeSingle()

    if (userData && !userData.onboarded) {
      setRedirecting(true)
      router.replace('/onboarding')
      return
    }

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!company) {
      setLoading(false)
      return
    }

    setCompanyId(company.id)

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle()

    const isActive = sub?.status === 'active'
    setActive(isActive)

    if (isActive) {
      await loadAppointments(company.id, selectedDate)
    }

    setLoading(false)
  }

  async function loadAppointments(companyId: string, date: Date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('company_id', companyId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    setAppointments(data || [])
  }

  useEffect(() => {
    if (companyId && active) {
      loadAppointments(companyId, selectedDate)
    }
  }, [selectedDate, companyId, active])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!active && companyId) {
        init()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [active, companyId])

  if (loading || redirecting) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Carregando sistema...</p>

        <style jsx>{`
          .loading {
            height: 100vh;
            background: #05070d;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #1e293b;
            border-top: 4px solid #7c3aed;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  if (!active) {
    return (
      <div className="pay">
        <div className="card">
          <h1>Ative seu acesso</h1>
          <p>Assine para usar o sistema</p>

          <a
            href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=d88141f49f214b219ae94d623529c5c5"
            className="btn"
          >
            Assinar R$39,90/mês
          </a>
        </div>

        <style jsx>{`
          .pay {
            height: 100vh;
            background: radial-gradient(circle at top, #0a0f1f, #05070d);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .card {
            background: #0b0f1a;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 0 40px rgba(124, 58, 237, 0.3);
          }

          .btn {
            margin-top: 20px;
            display: inline-block;
            padding: 14px 30px;
            border-radius: 12px;
            background: linear-gradient(135deg, #7c3aed, #06b6d4);
            color: white;
            font-weight: bold;
            text-decoration: none;
            transition: 0.3s;
          }

          .btn:hover {
            transform: scale(1.07);
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>AgendPro</h1>

        <button className="btn" onClick={() => setShowModal(true)}>
          + Novo agendamento
        </button>

        <button
          className="logout"
          onClick={async () => {
            await supabase.auth.signOut()
            router.replace('/login')
          }}
        >
          Sair
        </button>
      </aside>

      <main className="main">
        <h2>{format(selectedDate, 'dd/MM/yyyy')}</h2>

        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
        />

        <div className="list">
          {appointments.length === 0 && (
            <p className="empty">Nenhum agendamento</p>
          )}

          {appointments.map((a) => (
            <div key={a.id} className="item">
              <span>{a.client_name}</span>
              <span>
                {new Date(a.start_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      </main>

      {showModal && companyId && (
        <CreateAppointmentModal
          companyId={companyId}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onCreated={() => loadAppointments(companyId, selectedDate)}
        />
      )}

      <style jsx>{`
        .app {
          display: flex;
          height: 100vh;
          background: #05070d;
          color: white;
        }

        .sidebar {
          width: 240px;
          background: #0b0f1a;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .btn {
          margin-top: 20px;
          padding: 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          border: none;
          color: white;
          cursor: pointer;
          transition: 0.3s;
        }

        .btn:hover {
          transform: scale(1.05);
        }

        .logout {
          background: none;
          color: #f87171;
        }

        .main {
          flex: 1;
          padding: 40px;
        }

        .list {
          margin-top: 20px;
        }

        .item {
          background: #0b0f1a;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
        }

        .empty {
          text-align: center;
          color: #777;
        }
      `}</style>
    </div>
  )
}