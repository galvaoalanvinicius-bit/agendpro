'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CreateAppointmentModal({
  companyId,
  selectedDate,
  onClose,
  onCreated
}: any) {

  const [services, setServices] = useState<any[]>([])
  const [clientName, setClientName] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [time, setTime] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyId)

      if (error) {
        console.error(error)
        return
      }

      setServices(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  function updatePreview() {
    const service = services.find(s => s.id === serviceId)
    if (!service || !time) return

    const [h, m] = time.split(':').map(Number)

    const start = new Date(selectedDate)
    start.setHours(h, m, 0, 0)

    const end = new Date(start.getTime() + service.duration * 60000)

    setPreview(end.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }))
  }

  useEffect(() => {
    updatePreview()
  }, [serviceId, time])

  async function handleSave() {
    if (!clientName || !serviceId || !time) {
      alert('Preencha todos os campos')
      return
    }

    try {
      setLoading(true)

      const service = services.find(s => s.id === serviceId)
      if (!service) {
        alert('Serviço inválido')
        return
      }

      const [h, m] = time.split(':').map(Number)

      const start = new Date(selectedDate)
      start.setHours(h, m, 0, 0)

      const end = new Date(start.getTime() + service.duration * 60000)

      // 🔒 anti conflito melhorado
      const { data: conflict, error: conflictError } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId)
        .lt('start_time', end.toISOString())
        .gt('end_time', start.toISOString())

      if (conflictError) {
        console.error(conflictError)
        alert('Erro ao validar horário')
        return
      }

      if (conflict && conflict.length > 0) {
        alert('Já existe agendamento nesse horário')
        return
      }

      const { error } = await supabase.from('appointments').insert({
        company_id: companyId,
        client_name: clientName,
        service_id: serviceId,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      })

      if (error) {
        console.error(error)
        alert('Erro ao salvar')
        return
      }

      onCreated()
      onClose()

    } catch (err) {
      console.error(err)
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white w-[420px] p-6 rounded-2xl shadow-xl space-y-4">

        <h2 className="text-xl font-bold">Novo agendamento</h2>

        <input
          placeholder="Cliente"
          className="w-full border p-2 rounded"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />

        <select
          value={serviceId}
          className="w-full border p-2 rounded"
          onChange={(e) => setServiceId(e.target.value)}
        >
          <option value="">Selecione serviço</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration} min)
            </option>
          ))}
        </select>

        <input
          type="time"
          className="w-full border p-2 rounded"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        {preview && (
          <p className="text-green-600 text-sm">
            Termina às {preview}
          </p>
        )}

        <button
          disabled={loading}
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white p-2 rounded-lg"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>

      </div>
    </div>
  )
}