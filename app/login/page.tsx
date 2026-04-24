'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  async function handleLogin() {
    await supabase.auth.signInWithOtp({ email })
    alert('Verifique seu email!')
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-6 bg-white shadow rounded">
        <h1 className="text-xl font-bold mb-4">AgendPro</h1>
        <p className="text-sm mb-4">Grupo NSG</p>

        <input
          className="border p-2 w-full"
          placeholder="Seu email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="mt-4 w-full bg-black text-white p-2 rounded"
        >
          Entrar
        </button>
      </div>
    </div>
  )
}
