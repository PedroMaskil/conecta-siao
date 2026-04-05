'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type PerfilUsuario = {
  id: string
  nome: string
  idade: number
  telefone: string
  email: string
  endereco: string
  tipo: string
}

export default function Login() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      alert('Preencha e-mail e senha.')
      return
    }

    setLoading(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      alert('Erro no login: ' + loginError.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      alert('Não foi possível identificar o usuário logado.')
      setLoading(false)
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single<PerfilUsuario>()

    if (perfilError || !perfil) {
      alert('Não foi possível carregar o perfil do usuário.')
      setLoading(false)
      return
    }

    if (perfil.tipo === 'lider') {
      router.push('/lider')
      return
    }

    if (perfil.tipo === 'supervisor') {
      router.push('/supervisor')
      return
    }

    if (perfil.tipo === 'secretaria') {
      router.push('/secretaria')
      return
    }

    if (perfil.tipo === 'superAdmin') {
      router.push('/super-admin')
      return
    }

    alert('Tipo de usuário inválido.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Conecta Sião</h1>
          <p className="text-sm text-slate-500 mt-2">
            Entre com sua conta
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}