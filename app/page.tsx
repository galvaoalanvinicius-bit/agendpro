'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import CreateAppointmentModal from '../components/CreateAppointmentModal'

export default function Home() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    init()
  }, [])

  async function init() {
    try {
      setLoading(true)
      setErrorMsg('')

      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        setErrorMsg('Erro de autenticação')
        return
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', data.user.id)
        .single()

      if (companyError || !company) {
        setErrorMsg('Empresa não encontrada')
        return
      }

      setCompanyId(company.id)

      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', company.id)
        .single()

      if (subError) {
        console.error(subError)
      }

      const isActive = sub?.status === 'active'
      setActive(isActive)

      if (isActive) {
        await loadAppointments(company.id, selectedDate)
      }

    } catch (err) {
      console.error(err)
      setErrorMsg('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function loadAppointments(companyId: string, date: Date) {
    try {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)

      const end = new Date(date)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time')

      if (error) {
        console.error(error)
        return
      }

      setAppointments(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (companyId && active) {
      loadAppointments(companyId, selectedDate)
    }
  }, [selectedDate])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 animate-pulse">
        Carregando sistema...
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {errorMsg}
      </div>
    )
  }

  if (!active) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow text-center">
          <h1 className="text-xl font-bold mb-2">Acesso bloqueado</h1>
          <p className="text-gray-500 mb-4">
            Assine o plano para usar o sistema
          </p>

          <a
            href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=d88141f49f214b219ae94d623529c5c5"
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg"
          >
            Assinar R$39,90
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">

      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold">AgendPro</h1>
          <p className="text-xs text-gray-400 mb-6">Gestão inteligente</p>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-2 rounded-lg shadow"
          >
            + Novo agendamento
          </button>
        </div>

        <span className="text-xs text-gray-500">v1.0</span>
      </aside>

      <main className="flex-1 p-10">

        <div className="flex justify-between mb-6">
          <h2 className="text-3xl font-semibold">
            {format(selectedDate, 'dd/MM/yyyy')}
          </h2>

          <span className="text-gray-400">
            {appointments.length} agendamentos
          </span>
        </div>

        <div className="grid grid-cols-3 gap-8">

          <div className="bg-white p-5 rounded-2xl shadow-sm border">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
            />
          </div>

          <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border space-y-3">

            {appointments.length === 0 && (
              <p className="text-gray-400 text-center">
                Nenhum agendamento
              </p>
            )}

            {appointments.map(a => (
              <div
                key={a.id}
                className="flex justify-between items-center p-4 rounded-xl border hover:shadow-md transition"
              >
                <span className="font-medium">{a.client_name}</span>

                <span className="text-blue-600 font-semibold">
                  {new Date(a.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}

          </div>

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
    </div>
  )
}