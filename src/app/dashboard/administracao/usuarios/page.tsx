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

export default function AdministracaoPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')

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

  const usuariosFiltrados = useMemo(() => {
    return usuarios
      .filter((u) =>
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase())
      )
      .filter((u) => {
        if (filtro === 'lider') return u.is_lider
        if (filtro === 'supervisor') return u.is_supervisor
        return true
      })
  }, [usuarios, busca, filtro])

  async function togglePermissao(
    id: string,
    campo: 'is_lider' | 'is_supervisor',
    valor: boolean
  ) {
    await supabase.from('usuarios').update({ [campo]: valor }).eq('id', id)

    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [campo]: valor } : u))
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        Carregando...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Atribuição de Usuários</h1>
                <p className="text-sm text-orange-50">
                  Gestão de usuários e permissões
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/dashboard/administracao')}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Voltar
                </button>
              </div>
            </div>

            <div className="space-y-6 p-8">
              <div className="flex flex-col gap-4 md:flex-row">
                <input
                  placeholder="Buscar usuário..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

                <select
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="todos">Todos</option>
                  <option value="lider">Líderes</option>
                  <option value="supervisor">Supervisores</option>
                </select>
              </div>

              <div className="space-y-3">
                {usuariosFiltrados.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-slate-800 leading-tight">
                          {user.nome}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-500">
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

                          {!user.is_lider && !user.is_supervisor && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Usuário comum
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-1 gap-2 pt-1 sm:grid-cols-2 md:w-auto md:min-w-[280px]">
                        <button
                          onClick={() =>
                            togglePermissao(user.id, 'is_lider', !user.is_lider)
                          }
                          className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                            user.is_lider
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`}
                        >
                          {user.is_lider ? 'Remover Líder' : 'Tornar Líder'}
                        </button>

                        <button
                          onClick={() =>
                            togglePermissao(
                              user.id,
                              'is_supervisor',
                              !user.is_supervisor
                            )
                          }
                          className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                            user.is_supervisor
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-amber-500 hover:bg-amber-600'
                          }`}
                        >
                          {user.is_supervisor
                            ? 'Remover Supervisor'
                            : 'Tornar Supervisor'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {usuariosFiltrados.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}