'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      window.location.href = '/'
      return
    }

    setLoading(false)
  }

  async function handleAuth() {
    if (!email || !password) {
      alert('Preencha tudo')
      return
    }

    setLoading(true)

    let error = null

    if (isLogin) {
      const res = await supabase.auth.signInWithPassword({
        email,
        password
      })
      error = res.error
    } else {
      const res = await supabase.auth.signUp({
        email,
        password
      })
      error = res.error
    }

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // 🔥 GARANTE QUE A SESSÃO FOI SALVA
    await new Promise(r => setTimeout(r, 300))

    window.location.href = '/'
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