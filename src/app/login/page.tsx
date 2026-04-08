'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type ToastType = 'success' | 'error'

export default function Login() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    visible: boolean
  }>({
    message: '',
    type: 'success',
    visible: false,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 80)

    return () => clearTimeout(timer)
  }, [])

  function showToast(message: string, type: ToastType = 'success') {
    setToast({
      message,
      type,
      visible: true,
    })

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visible: false,
      }))
    }, 3200)
  }

  async function handleLogin() {
    if (!email || !password) {
      showToast('Preencha e-mail e senha.', 'error')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      showToast('Erro no login: ' + error.message, 'error')
      setLoading(false)
      return
    }

    showToast('Login realizado com sucesso!', 'success')

    setTimeout(() => {
      router.push('/dashboard')
    }, 1200)

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-green-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      {toast.visible && (
        <div
          className={`fixed right-5 top-5 z-50 min-w-[280px] max-w-sm rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-600 text-white'
              : 'border-red-200 bg-red-500 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                toast.type === 'success' ? 'bg-green-200' : 'bg-red-200'
              }`}
            />
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div
          className={`w-full max-w-lg transform transition-all duration-700 ${
            mounted
              ? 'translate-y-0 opacity-100'
              : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-8 text-white">
              <h1 className="text-4xl font-bold tracking-tight">Conecta Sião</h1>
              <p className="mt-2 text-sm text-green-50">
                Entre com sua conta para acessar o sistema
              </p>
            </div>

            <div className="p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleLogin()
                }}
                className="grid gap-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="mt-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-200 transition duration-200 hover:-translate-y-0.5 hover:from-green-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>

                <button
                  onClick={() => router.push('/cadastro')}
                  type="button"
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
                >
                  Ainda não tem conta? Criar cadastro
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}