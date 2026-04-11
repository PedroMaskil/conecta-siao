'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Usuario = {
  id: string
  nome: string
  email: string
  is_lider?: boolean | null
  is_supervisor?: boolean | null
  is_secretaria?: boolean | null
  is_super_admin?: boolean | null
}

type ToastType = 'success' | 'error'

export default function AdministracaoPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('is_secretaria, is_super_admin')
        .eq('id', user.id)
        .single()

      if (!perfil || (!perfil.is_secretaria && !perfil.is_super_admin)) {
        router.push('/dashboard')
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true })

      setUsuarios(data || [])
      setLoading(false)
    }

    load()
  }, [router, supabase])

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3500)
  }

  const usuariosFiltrados = useMemo(() => {
    return usuarios
      .filter(
        (u) =>
          u.nome.toLowerCase().includes(busca.toLowerCase()) ||
          u.email.toLowerCase().includes(busca.toLowerCase())
      )
      .filter((u) => {
        if (filtro === 'lider') return u.is_lider
        if (filtro === 'supervisor') return u.is_supervisor
        return true
      })
  }, [usuarios, busca, filtro])

  const totalLideres = useMemo(() => usuarios.filter((u) => u.is_lider).length, [usuarios])
  const totalSupervisores = useMemo(() => usuarios.filter((u) => u.is_supervisor).length, [usuarios])

  async function togglePermissao(
    id: string,
    campo: 'is_lider' | 'is_supervisor',
    valor: boolean
  ) {
    const { error } = await supabase.from('usuarios').update({ [campo]: valor }).eq('id', id)

    if (error) {
      showToast('Erro ao atualizar permissão.', 'error')
      return
    }

    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, [campo]: valor } : u)))

    const label = campo === 'is_lider' ? 'Líder' : 'Supervisor'
    showToast(
      valor ? `Permissão de ${label} concedida!` : `Permissão de ${label} removida.`,
      'success'
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando...</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Toast ── */}
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
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                toast.type === 'success' ? 'bg-green-200' : 'bg-red-200'
              }`}
            />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* ── Página ── */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex justify-center">
          <div
            className={`w-full max-w-6xl transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
                <div>
                  <h1 className="text-3xl font-bold">Usuários e Permissões</h1>
                  <p className="text-sm text-orange-50">
                    Gerencie líderes e supervisores do sistema
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/administracao')}
                  className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30"
                >
                  Voltar
                </button>
              </div>

              <div className="space-y-6 p-8">

                {/* Cards resumo */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <p className="text-xs text-slate-500">Total de usuários</p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-800">{usuarios.length}</h2>
                  </div>
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
                    <p className="text-xs text-slate-500">Líderes</p>
                    <h2 className="mt-2 text-3xl font-bold text-green-700">{totalLideres}</h2>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                    <p className="text-xs text-slate-500">Supervisores</p>
                    <h2 className="mt-2 text-3xl font-bold text-blue-700">{totalSupervisores}</h2>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    placeholder="Buscar por nome ou e-mail..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                  <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="todos">Todos</option>
                    <option value="lider">Líderes</option>
                    <option value="supervisor">Supervisores</option>
                  </select>
                </div>

                <p className="text-sm text-slate-500">
                  {usuariosFiltrados.length} usuário(s) encontrado(s)
                </p>

                {/* Lista */}
                <div className="space-y-3">
                  {usuariosFiltrados.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </div>
                  ) : (
                    usuariosFiltrados.map((user) => (
                      <div
                        key={user.id}
                        className="rounded-2xl border border-slate-200 p-5 transition hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold text-slate-800 leading-tight">
                              {user.nome}
                            </p>
                            <p className="mt-0.5 break-all text-sm text-slate-500">
                              {user.email}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {user.is_lider && (
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                  Líder
                                </span>
                              )}
                              {user.is_supervisor && (
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                  Supervisor
                                </span>
                              )}
                              {user.is_secretaria && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                  Administração
                                </span>
                              )}
                              {user.is_super_admin && (
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                                  Super Admin
                                </span>
                              )}
                              {!user.is_lider && !user.is_supervisor && !user.is_secretaria && !user.is_super_admin && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                  Usuário comum
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 md:w-auto md:min-w-[280px]">
                            <button
                              onClick={() => togglePermissao(user.id, 'is_lider', !user.is_lider)}
                              className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                                user.is_lider
                                  ? 'bg-red-500 hover:bg-red-600'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {user.is_lider ? 'Remover Líder' : 'Tornar Líder'}
                            </button>

                            <button
                              onClick={() => togglePermissao(user.id, 'is_supervisor', !user.is_supervisor)}
                              className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                                user.is_supervisor
                                  ? 'bg-red-500 hover:bg-red-600'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {user.is_supervisor ? 'Remover Supervisor' : 'Tornar Supervisor'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}