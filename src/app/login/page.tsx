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
    const timer = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(timer)
  }, [])

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 py-6 sm:px-4 sm:py-10">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-green-200/30 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl sm:h-72 sm:w-72" />
      </div>

      {/* TOAST MOBILE FIX */}
      {toast.visible && (
        <div
          className={`fixed left-3 right-3 top-4 z-50 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 sm:left-auto sm:right-5 sm:top-5 sm:min-w-[280px] sm:max-w-sm ${
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

      {/* CONTAINER */}
      <div className="relative z-10 flex min-h-[calc(100vh-3rem)] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div
          className={`w-full max-w-lg transform transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-6 text-white sm:px-8 sm:py-8">
              <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                Conecta Sião
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-green-50">
                Entre com sua conta
              </p>
            </div>

            {/* FORM */}
            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid gap-4">

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="mt-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:from-green-700 hover:to-emerald-600 disabled:opacity-60"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>

                <button
                  onClick={() => router.push('/cadastro')}
                  type="button"
                  className="text-xs sm:text-sm font-medium text-slate-500 transition hover:text-slate-700"
                >
                  Ainda não tem conta? Criar cadastro
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}