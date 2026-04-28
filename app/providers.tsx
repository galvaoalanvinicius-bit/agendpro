'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          router.refresh()
          router.push('/') // dashboard
        }

        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    supabase.auth.getSession()
  }, [])

  return <>{children}</>
}