'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin_master' | 'profissional' | 'cliente'

export type AuthProfile = {
  id: string
  name: string | null
  role: UserRole
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (!user) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', user.id)
        .single()

      if (!mounted) return
      setProfile(prof as AuthProfile | null)
      setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const isAdmin = profile?.role === 'admin_master'
  const isProfissional = profile?.role === 'profissional'

  return { user, profile, loading, isAdmin, isProfissional }
}