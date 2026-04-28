'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setEmail(data.user?.email || '')
    }

    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur">

      <h2 className="text-lg font-semibold">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">

        <span className="text-sm text-white/60">
          {email}
        </span>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm"
        >
          Sair
        </button>

      </div>
    </div>
  )
}