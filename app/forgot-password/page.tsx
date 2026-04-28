'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) return alert(error.message)

    alert('Email de recuperação enviado!')
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-[380px] bg-white p-8 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4">Recuperar senha</h1>

        <input
          className="w-full p-3 border rounded mb-4"
          placeholder="Seu email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-black text-white p-3 rounded"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </div>
    </div>
  )
}