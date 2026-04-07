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

type Celula = {
  id: string
  nome: string
  lider_id: string | null
}

type Relatorio = {
  id: string
  celula_id: string | null
  criado_em: string | null
  celulas?: { nome: string } | null
}

type Aba = 'usuarios' | 'celulas' | 'relatorios'

export default function GestaoUsuariosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<Aba>('usuarios')

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])

  const [busca, setBusca] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)

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
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (!perfil?.is_super_admin) {
        router.push('/dashboard')
        return
      }

      const [{ data: usuariosData }, { data: celulasData }, { data: relatoriosData }] =
        await Promise.all([
          supabase.from('usuarios').select('*').order('nome', { ascending: true }),
          supabase.from('celulas').select('id, nome, lider_id').order('nome', { ascending: true }),
          supabase
            .from('relatorios')
            .select('id, celula_id, criado_em, celulas(nome)')
            .order('criado_em', { ascending: false }),
        ])

      setUsuarios(usuariosData || [])
      setCelulas(celulasData || [])
      setRelatorios(relatoriosData || [])
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase())
    )
  }, [usuarios, busca])

  const celulasFiltradas = useMemo(() => {
    return celulas.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
  }, [celulas, busca])

  const relatoriosFiltrados = useMemo(() => {
    return relatorios.filter((r) =>
      (r.celulas?.nome || '').toLowerCase().includes(busca.toLowerCase())
    )
  }, [relatorios, busca])

  function getNomeUsuario(id: string | null) {
    if (!id) return 'Sem líder'
    const u = usuarios.find((u) => u.id === id)
    return u ? u.nome : 'Não encontrado'
  }

  async function toggleAdmin(id: string, valor: boolean) {
    await supabase.from('usuarios').update({ is_secretaria: valor }).eq('id', id)
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, is_secretaria: valor } : u)))
  }

  async function excluirUsuario(id: string) {
    await supabase.from('usuarios').delete().eq('id', id)
    setUsuarios((prev) => prev.filter((u) => u.id !== id))
    setConfirmando(null)
  }

  async function excluirCelula(id: string) {
    await supabase.from('celulas').delete().eq('id', id)
    setCelulas((prev) => prev.filter((c) => c.id !== id))
    setConfirmando(null)
  }

  async function excluirRelatorio(id: string) {
    await supabase.from('relatorios').delete().eq('id', id)
    setRelatorios((prev) => prev.filter((r) => r.id !== id))
    setConfirmando(null)
  }

  const abas: { id: Aba; label: string; count: number }[] = [
    { id: 'usuarios', label: 'Usuários', count: usuarios.length },
    { id: 'celulas', label: 'Células', count: celulas.length },
    { id: 'relatorios', label: 'Relatórios', count: relatorios.length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        Carregando...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-violet-100 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-purple-600 to-violet-500 px-6 py-6 text-white sm:px-8">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Gestão de Usuários</h1>
                <p className="mt-1 text-sm text-purple-100">
                  Gerencie permissões sensíveis e acessos avançados
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/dashboard/secretaria')}
                  className="rounded-xl border border-white/60 bg-transparent px-4 py-2 text-sm text-white transition hover:bg-white/20"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hidden md:block rounded-xl border border-white/60 bg-transparent px-4 py-2 text-sm text-white transition hover:bg-white/20"
                >
                  Dashboard
                </button>
              </div>
            </div>

            <div className="space-y-5 p-4 sm:space-y-6 sm:p-8">

              {/* Métricas */}
              <div className="flex gap-2 md:grid md:grid-cols-3 md:gap-4">
                {abas.map((aba) => (
                  <button
                    key={aba.id}
                    onClick={() => { setAbaAtiva(aba.id); setBusca('') }}
                    className={`flex-1 rounded-2xl border p-3 shadow-sm text-center md:p-5 transition-all ${
                      abaAtiva === aba.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-purple-200'
                    }`}
                  >
                    <p className={`text-xs md:text-sm ${abaAtiva === aba.id ? 'text-purple-500' : 'text-slate-500'}`}>
                      {aba.label}
                    </p>
                    <h2 className={`mt-1 text-xl font-bold md:mt-2 md:text-3xl ${
                      abaAtiva === aba.id ? 'text-purple-700' : 'text-slate-800'
                    }`}>
                      {aba.count}
                    </h2>
                  </button>
                ))}
              </div>

              {/* Busca */}
              <input
                placeholder={`Buscar ${abaAtiva === 'usuarios' ? 'usuário' : abaAtiva === 'celulas' ? 'célula' : 'relatório'}...`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />

              {/* Conteúdo */}
              <div className="space-y-3">

                {/* Aba Usuários */}
                {abaAtiva === 'usuarios' && (
                  <>
                    {usuariosFiltrados.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                        Nenhum usuário encontrado.
                      </div>
                    ) : (
                      usuariosFiltrados.map((user) => (
                        <div
                          key={user.id}
                          className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-semibold text-slate-800">{user.nome}</p>
                              <p className="mt-0.5 break-all text-sm text-slate-500">{user.email}</p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {user.is_lider && (
                                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Líder</span>
                                )}
                                {user.is_supervisor && (
                                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Supervisor</span>
                                )}
                                {user.is_secretaria && (
                                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">Administrador</span>
                                )}
                                {user.is_super_admin && (
                                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">Super Admin</span>
                                )}
                                {!user.is_lider && !user.is_supervisor && !user.is_secretaria && !user.is_super_admin && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Usuário comum</span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:w-auto md:min-w-[280px]">
                              <button
                                onClick={() => toggleAdmin(user.id, !user.is_secretaria)}
                                className={`rounded-xl px-3 py-2.5 text-xs font-semibold text-white transition col-span-2 ${
                                  user.is_secretaria
                                    ? 'bg-orange-400 hover:bg-orange-500'
                                    : 'bg-purple-500 hover:bg-purple-600'
                                }`}
                              >
                                {user.is_secretaria ? 'Remover administrador' : 'Tornar administrador'}
                              </button>

                              {confirmando === `del-user-${user.id}` ? (
                                <>
                                  <button
                                    onClick={() => excluirUsuario(user.id)}
                                    className="rounded-xl bg-red-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setConfirmando(null)}
                                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmando(`del-user-${user.id}`)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition col-span-2"
                                >
                                  Excluir usuário
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Aba Células */}
                {abaAtiva === 'celulas' && (
                  <>
                    {celulasFiltradas.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                        Nenhuma célula encontrada.
                      </div>
                    ) : (
                      celulasFiltradas.map((celula) => (
                        <div
                          key={celula.id}
                          className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800">{celula.nome}</p>
                              <p className="mt-0.5 text-sm text-slate-500">
                                Líder: {getNomeUsuario(celula.lider_id)}
                              </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              {confirmando === `del-cel-${celula.id}` ? (
                                <>
                                  <button
                                    onClick={() => excluirCelula(celula.id)}
                                    className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setConfirmando(null)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmando(`del-cel-${celula.id}`)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                                >
                                  Excluir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Aba Relatórios */}
                {abaAtiva === 'relatorios' && (
                  <>
                    {relatoriosFiltrados.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                        Nenhum relatório encontrado.
                      </div>
                    ) : (
                      relatoriosFiltrados.map((relatorio) => (
                        <div
                          key={relatorio.id}
                          className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800">
                                {relatorio.celulas?.nome || 'Célula removida'}
                              </p>
                              <p className="mt-0.5 text-sm text-slate-500">
                                {relatorio.criado_em
                                  ? new Date(relatorio.criado_em).toLocaleString('pt-BR', {
                                      timeZone: 'America/Sao_Paulo',
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })
                                  : 'Data desconhecida'}
                              </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              {confirmando === `del-rel-${relatorio.id}` ? (
                                <>
                                  <button
                                    onClick={() => excluirRelatorio(relatorio.id)}
                                    className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setConfirmando(null)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmando(`del-rel-${relatorio.id}`)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                                >
                                  Excluir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}