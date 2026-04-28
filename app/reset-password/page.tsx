'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) return alert(error.message)

    alert('Senha atualizada!')
    router.push('/login')
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-[380px] bg-white p-8 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4">Nova senha</h1>

        <input
          type="password"
          className="w-full p-3 border rounded mb-4"
          placeholder="Nova senha"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={updatePassword}
          className="w-full bg-black text-white p-3 rounded"
        >
          Atualizar senha
        </button>
      </div>
    </div>
  )
}