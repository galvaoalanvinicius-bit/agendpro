'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  companyId: string
  selectedDate: Date
  onClose: () => void
  onCreated: () => void
}

type Service = {
  id: string
  name: string
  duration: number
}

export default function CreateAppointmentModal({
  companyId,
  selectedDate,
  onClose,
  onCreated
}: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [clientName, setClientName] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', companyId)

    setServices(data || [])
  }

  async function handleCreate() {
    if (!serviceId || !time) return alert('Preencha tudo')

    setLoading(true)

    const service = services.find(s => s.id === serviceId)

    if (!service) {
      setLoading(false)
      return alert('Serviço inválido')
    }

    const start = new Date(selectedDate)
    const [h, m] = time.split(':')
    start.setHours(Number(h), Number(m))

    const end = new Date(start)
    end.setMinutes(end.getMinutes() + service.duration)

    const { error } = await supabase.from('appointments').insert({
      company_id: companyId,
      service_id: serviceId,
      client_name: clientName,
      start_time: start.toISOString(),
      end_time: end.toISOString()
    })

    setLoading(false)

    if (error) {
      alert('Erro ao criar')
      return
    }

    onCreated()
    onClose()
  }

  return (
    <div className="overlay">
      <div className="modal">
        <h2>Novo Agendamento</h2>

        <input
          placeholder="Cliente"
          onChange={(e) => setClientName(e.target.value)}
        />

        <select onChange={(e) => setServiceId(e.target.value)}>
          <option value="">Selecione serviço</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration} min)
            </option>
          ))}
        </select>

        <input type="time" onChange={(e) => setTime(e.target.value)} />

        <button onClick={handleCreate} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>

        <button onClick={onClose}>Cancelar</button>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          background: #0b0f1a;
          padding: 30px;
          border-radius: 20px;
          color: white;
          width: 300px;
        }

        input, select {
          width: 100%;
          margin-top: 10px;
          padding: 10px;
          border-radius: 8px;
          border: none;
        }

        button {
          width: 100%;
          margin-top: 10px;
          padding: 10px;
          border-radius: 10px;
          background: linear-gradient(135deg,#7c3aed,#06b6d4);
          color: white;
        }
      `}</style>
    </div>
  )
}