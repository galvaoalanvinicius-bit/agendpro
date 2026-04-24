'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ServicesPage() {

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)

  const [services, setServices] = useState<any[]>([])
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [color, setColor] = useState(colors[0])
  const [editId, setEditId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
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

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', company.id)
        .single()

      const isActive = sub?.status === 'active'
      setActive(isActive)

      if (isActive) {
        await load(company.id)
      }

    } catch (err) {
      console.error(err)
      setErrorMsg('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function load(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyId)

      if (error) {
        console.error(error)
        setErrorMsg('Erro ao carregar serviços')
        return
      }

      setServices(data || [])
    } catch (err) {
      console.error(err)
      setErrorMsg('Erro inesperado')
    }
  }

  function resetForm() {
    setName('')
    setDuration('')
    setColor(colors[0])
    setEditId(null)
  }

  async function save() {

    if (!name.trim() || !duration) {
      alert('Preencha todos os campos')
      return
    }

    const durationNumber = Number(duration)

    if (isNaN(durationNumber) || durationNumber <= 0) {
      alert('Duração inválida')
      return
    }

    if (!companyId) return

    try {
      setSaving(true)

      if (editId) {
        const { error } = await supabase
          .from('services')
          .update({
            name,
            duration: durationNumber,
            color
          })
          .eq('id', editId)

        if (error) {
          console.error(error)
          alert('Erro ao atualizar')
          return
        }

      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            name,
            duration: durationNumber,
            color,
            company_id: companyId
          })

        if (error) {
          console.error(error)
          alert('Erro ao criar')
          return
        }
      }

      resetForm()
      await load(companyId)

    } catch (err) {
      console.error(err)
      alert('Erro inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-gray-400 animate-pulse">
        Carregando serviços...
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="p-8 text-red-500">
        {errorMsg}
      </div>
    )
  }

  if (!active) {
    return (
      <div className="p-8 text-gray-500">
        Plano inativo
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">Serviços</h1>

      <div className="bg-white p-4 rounded-xl mb-6 flex flex-wrap gap-2 items-center">

        <input
          placeholder="Nome do serviço"
          className="border p-2 rounded flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Min"
          className="border p-2 rounded w-24"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <div className="flex gap-2">
          {colors.map(c => (
            <div
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full cursor-pointer border-2 ${
                color === c ? 'border-black' : 'border-transparent'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded"
        >
          {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Criar'}
        </button>

        {editId && (
          <button
            onClick={resetForm}
            className="text-gray-500 text-sm"
          >
            cancelar
          </button>
        )}

      </div>

      <div className="grid grid-cols-3 gap-4">

        {services.length === 0 && (
          <p className="text-gray-400">Nenhum serviço cadastrado</p>
        )}

        {services.map(s => (
          <div
            key={s.id}
            className="bg-white p-4 rounded-xl flex justify-between items-center shadow-sm border"
          >

            <div>
              <div
                className="w-3 h-3 rounded-full inline-block mr-2"
                style={{ background: s.color }}
              />
              <span className="font-medium">{s.name}</span>
              <span className="text-gray-400 ml-2">
                {s.duration} min
              </span>
            </div>

            <button
              onClick={() => {
                setEditId(s.id)
                setName(s.name)
                setDuration(String(s.duration))
                setColor(s.color)
              }}
              className="text-blue-600 text-sm"
            >
              editar
            </button>

          </div>
        ))}

      </div>

    </div>
  )
}