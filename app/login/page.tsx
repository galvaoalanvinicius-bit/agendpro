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
  const [showModal, setShowModal] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])

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
      .single()

    if (userData && !userData.onboarded) {
      setRedirecting(true)
      router.replace('/onboarding')
      return
    }

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (!company) {
      setLoading(false)
      return
    }

    setCompanyId(company.id)

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', company.id)
      .single()

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

  if (loading || redirecting) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Carregando...</p>

        <style jsx>{`
          .loading-screen {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #05070d;
            color: #fff;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #1e293b;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
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
      <div className="pay-screen">
        <div className="card">
          <h1>Ative seu acesso</h1>
          <p>Assine para liberar o sistema</p>

          <a
            href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=d88141f49f214b219ae94d623529c5c5"
            className="btn"
          >
            Assinar plano
          </a>
        </div>

        <style jsx>{`
          .pay-screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at top, #0a0f1f, #05070d);
            color: white;
          }

          .card {
            background: #0b0f1a;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 0 40px rgba(79, 70, 229, 0.3);
          }

          h1 {
            margin-bottom: 10px;
          }

          .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 14px 28px;
            border-radius: 12px;
            background: linear-gradient(135deg, #7c3aed, #06b6d4);
            color: white;
            font-weight: bold;
            text-decoration: none;
            transition: 0.3s;
          }

          .btn:hover {
            transform: scale(1.05);
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

        <button
          className="btn"
          onClick={() => setShowModal(true)}
        >
          + Novo
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

        {appointments.map((a) => (
          <div key={a.id} className="card2">
            {a.client_name}
          </div>
        ))}
      </main>

      <style jsx>{`
        .app {
          display: flex;
          height: 100vh;
          background: #05070d;
          color: white;
        }

        .sidebar {
          width: 220px;
          padding: 20px;
          background: #0b0f1a;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .btn {
          padding: 10px;
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

        .card2 {
          background: #0b0f1a;
          padding: 10px;
          border-radius: 10px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}