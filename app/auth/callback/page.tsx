'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleAuth() {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error) {
        console.error('Erro no callback:', error.message)
        router.replace('/login')
        return
      }

      // sucesso → vai pro sistema
      router.replace('/')
    }

    handleAuth()
  }, [router])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#05070d',
      color: 'white'
    }}>
      <div>
        <h1>Autenticando...</h1>
        <p>Aguarde um momento</p>
      </div>
    </div>
  )
}