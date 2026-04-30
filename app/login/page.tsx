'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          router.replace('/app') // 🔥 garante redirect correto
        }
      }
    )

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.replace('/app') // 🔥 mesma rota aqui
        return
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false) // 🔥 garante que nunca trava
    }
  }

  async function handleAuth() {
    if (!email || !password) {
      alert('Preencha tudo')
      return
    }

    setLoading(true)

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      // 🔥 FORÇA REDIRECT (resolve seu bug principal)
      if (data?.user) {
        router.replace('/app')
      }

    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      // 🔥 também trata cadastro
      if (data?.user) {
        router.replace('/app')
      }
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Carregando...</p>

        <style jsx>{`
          .loading-screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #05070d;
            color: white;
            flex-direction: column;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #1e293b;
            border-top: 4px solid #7c3aed;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="pay-screen">
      <div className="card">
        <h1>{isLogin ? 'Login' : 'Cadastro'}</h1>

        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn" onClick={handleAuth}>
          {isLogin ? 'Entrar' : 'Cadastrar'}
        </button>

        <p
          className="switch"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Criar conta' : 'Já tenho conta'}
        </p>
      </div>

      <style jsx>{`
        .pay-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top, #0a0f1f, #05070d);
          color: white;
        }

        .card {
          background: #0b0f1a;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 0 40px rgba(124, 58, 237, 0.3);
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 300px;
        }

        .input {
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #111827;
          color: white;
        }

        .btn {
          margin-top: 10px;
          padding: 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          border: none;
          color: white;
          cursor: pointer;
        }

        .switch {
          margin-top: 10px;
          color: #06b6d4;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}