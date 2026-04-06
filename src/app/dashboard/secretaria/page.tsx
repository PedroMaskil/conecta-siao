'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdministracaoPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<any[]>([])
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

  async function togglePermissao(id: string, campo: string, valor: boolean) {
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 py-6 sm:px-4 sm:py-10">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-orange-100/40 blur-3xl sm:h-72 sm:w-72" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

            {/* HEADER */}
            <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 text-white sm:px-8 sm:py-6">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  Administração
                </h1>
                <p className="text-xs sm:text-sm text-orange-50">
                  Gestão de usuários
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push('/dashboard/secretaria/supervisao')}
                  className="rounded-xl bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
                >
                  Supervisão
                </button>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="rounded-xl bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
                >
                  Voltar
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="space-y-5 p-4 sm:p-6 md:p-8">

              {/* FILTROS */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  placeholder="Buscar usuário..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

                <select
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="todos">Todos</option>
                  <option value="lider">Líderes</option>
                  <option value="supervisor">Supervisores</option>
                </select>
              </div>

              {/* LISTA */}
              <div className="space-y-3">
                {usuariosFiltrados.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {/* INFO */}
                    <div>
                      <p className="font-semibold text-slate-800">
                        {user.nome}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 break-all">
                        {user.email}
                      </p>
                    </div>

                    {/* BOTÕES */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          togglePermissao(user.id, 'is_lider', !user.is_lider)
                        }
                        className={`rounded-xl py-2 text-xs sm:text-sm font-semibold text-white ${
                          user.is_lider ? 'bg-red-500' : 'bg-orange-500'
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
                        className={`rounded-xl py-2 text-xs sm:text-sm font-semibold text-white ${
                          user.is_supervisor ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                      >
                        {user.is_supervisor
                          ? 'Remover'
                          : 'Supervisor'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}