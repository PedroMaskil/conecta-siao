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
  supervisor_id: string | null
  tipo_celula?: string | null
  dia_semana?: string | null
  atualizado_em?: string | null
}

type Relatorio = {
  id: string
  celula_id: string
  lider_id: string
  dia_semana_celula?: string | null
  realizou_celula?: boolean | null
  total_presentes?: number | null
  visitantes?: number | null
  motivo_nao_realizacao?: string | null
  criado_em?: string
}

type ToastType = 'success' | 'error'

export default function GestaoUsuariosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])

  const [buscaUsuarios, setBuscaUsuarios] = useState('')
  const [buscaCelulas, setBuscaCelulas] = useState('')
  const [buscaRelatorios, setBuscaRelatorios] = useState('')

  const [toast, setToast] = useState<{
    visible: boolean
    message: string
    type: ToastType
  }>({
    visible: false,
    message: '',
    type: 'success',
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
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (!perfil || perfil.is_super_admin !== true) {
        router.push('/dashboard')
        return
      }

      await carregarDados()
      setLoading(false)
    }

    load()
  }, [router, supabase])

  function showToast(message: string, type: ToastType = 'success') {
    setToast({
      visible: true,
      message,
      type,
    })

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3000)
  }

  async function carregarDados() {
    const [
      { data: usuariosData },
      { data: celulasData },
      { data: relatoriosData },
    ] = await Promise.all([
      supabase.from('usuarios').select('*').order('nome', { ascending: true }),
      supabase.from('celulas').select('*').order('nome', { ascending: true }),
      supabase.from('relatorios').select('*').order('criado_em', { ascending: false }),
    ])

    setUsuarios(usuariosData || [])
    setCelulas(celulasData || [])
    setRelatorios(relatoriosData || [])
  }

  function getNomeUsuario(id: string | null) {
    if (!id) return 'Não definido'
    return usuarios.find((u) => u.id === id)?.nome || 'Não encontrado'
  }

  function getNomeCelula(id: string) {
    return celulas.find((c) => c.id === id)?.nome || 'Célula não encontrada'
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = buscaUsuarios.toLowerCase()
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo)
    )
  }, [usuarios, buscaUsuarios])

  const celulasFiltradas = useMemo(() => {
    const termo = buscaCelulas.toLowerCase()
    return celulas.filter((c) => {
      const nomeLider = getNomeUsuario(c.lider_id).toLowerCase()
      return (
        c.nome.toLowerCase().includes(termo) ||
        nomeLider.includes(termo)
      )
    })
  }, [celulas, buscaCelulas, usuarios])

  const relatoriosFiltrados = useMemo(() => {
    const termo = buscaRelatorios.toLowerCase()
    return relatorios.filter((r) => {
      const nomeCelula = getNomeCelula(r.celula_id).toLowerCase()
      const nomeLider = getNomeUsuario(r.lider_id).toLowerCase()
      return nomeCelula.includes(termo) || nomeLider.includes(termo)
    })
  }, [relatorios, buscaRelatorios, usuarios, celulas])

  async function toggleAdministrador(userId: string, valor: boolean) {
    const { error } = await supabase
      .from('usuarios')
      .update({ is_secretaria: valor })
      .eq('id', userId)

    if (error) {
      showToast('Erro ao atualizar administrador.', 'error')
      return
    }

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, is_secretaria: valor } : u
      )
    )

    showToast(
      valor ? 'Usuário definido como administrador.' : 'Administrador removido.',
      'success'
    )
  }

  async function excluirUsuario(user: Usuario) {
    if (user.is_super_admin) {
      showToast('Não é permitido excluir um super admin por aqui.', 'error')
      return
    }

    const confirmar = window.confirm(
      `Deseja excluir o cadastro de ${user.nome}?\n\nIsso remove o registro da tabela usuários.`
    )

    if (!confirmar) return

    const { error } = await supabase.from('usuarios').delete().eq('id', user.id)

    if (error) {
      showToast('Erro ao excluir usuário.', 'error')
      return
    }

    setUsuarios((prev) => prev.filter((u) => u.id !== user.id))
    showToast('Cadastro do usuário removido.', 'success')
  }

  async function excluirCelula(celula: Celula) {
    const confirmar = window.confirm(
      `Deseja excluir a célula "${celula.nome}"?`
    )

    if (!confirmar) return

    const { error } = await supabase.from('celulas').delete().eq('id', celula.id)

    if (error) {
      showToast('Erro ao excluir célula.', 'error')
      return
    }

    setCelulas((prev) => prev.filter((c) => c.id !== celula.id))
    setRelatorios((prev) => prev.filter((r) => r.celula_id !== celula.id))
    showToast('Célula excluída.', 'success')
  }

  async function excluirRelatorio(relatorioId: string) {
    const confirmar = window.confirm('Deseja excluir este relatório?')

    if (!confirmar) return

    const { error } = await supabase
      .from('relatorios')
      .delete()
      .eq('id', relatorioId)

    if (error) {
      showToast('Erro ao excluir relatório.', 'error')
      return
    }

    setRelatorios((prev) => prev.filter((r) => r.id !== relatorioId))
    showToast('Relatório excluído.', 'success')
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
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-fuchsia-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-100/40 blur-3xl" />
      </div>

      {toast.visible && (
        <div
          className={`fixed right-5 top-5 z-50 min-w-[280px] max-w-sm rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'border-purple-200 bg-purple-600 text-white'
              : 'border-red-200 bg-red-500 text-white'
          }`}
        >
          <div className="text-sm font-medium">{toast.message}</div>
        </div>
      )}

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-7xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
                <p className="text-sm text-purple-50">
                  Controle avançado de usuários, células e relatórios
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Voltar
                </button>
              </div>
            </div>

            <div className="space-y-8 p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Usuários</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {usuarios.length}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Células</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {celulas.length}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Relatórios</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {relatorios.length}
                  </h2>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Usuários</h2>
                    <p className="text-sm text-slate-500">
                      Defina administrador e exclua cadastros
                    </p>
                  </div>

                  <input
                    placeholder="Buscar usuário..."
                    value={buscaUsuarios}
                    onChange={(e) => setBuscaUsuarios(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none md:max-w-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </div>

                <div className="space-y-3">
                  {usuariosFiltrados.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-semibold text-slate-800">
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
                            {user.is_secretaria && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Administrador
                              </span>
                            )}
                            {user.is_super_admin && (
                              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                                Super Admin
                              </span>
                            )}
                            {!user.is_lider &&
                              !user.is_supervisor &&
                              !user.is_secretaria &&
                              !user.is_super_admin && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  Usuário comum
                                </span>
                              )}
                          </div>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-2 pt-1 sm:grid-cols-2 md:w-auto md:min-w-[320px]">
                          <button
                            onClick={() =>
                              toggleAdministrador(user.id, !(user.is_secretaria === true))
                            }
                            disabled={user.is_super_admin === true}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                              user.is_secretaria
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-purple-600 hover:bg-purple-700'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {user.is_secretaria
                              ? 'Remover Administrador'
                              : 'Tornar Administrador'}
                          </button>

                          <button
                            onClick={() => excluirUsuario(user)}
                            disabled={user.is_super_admin === true}
                            className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Excluir usuário
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

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Células</h2>
                    <p className="text-sm text-slate-500">
                      Exclua células criadas no sistema
                    </p>
                  </div>

                  <input
                    placeholder="Buscar célula..."
                    value={buscaCelulas}
                    onChange={(e) => setBuscaCelulas(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none md:max-w-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </div>

                <div className="space-y-3">
                  {celulasFiltradas.map((celula) => (
                    <div
                      key={celula.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-semibold text-slate-800">
                            {celula.nome}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Líder: <span className="font-semibold">{getNomeUsuario(celula.lider_id)}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Tipo: <span className="font-semibold">{celula.tipo_celula || '-'}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Dia: <span className="font-semibold">{celula.dia_semana || '-'}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => excluirCelula(celula)}
                          className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                        >
                          Excluir célula
                        </button>
                      </div>
                    </div>
                  ))}

                  {celulasFiltradas.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                      Nenhuma célula encontrada.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
                    <p className="text-sm text-slate-500">
                      Exclua relatórios enviados
                    </p>
                  </div>

                  <input
                    placeholder="Buscar relatório..."
                    value={buscaRelatorios}
                    onChange={(e) => setBuscaRelatorios(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none md:max-w-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </div>

                <div className="space-y-3">
                  {relatoriosFiltrados.map((relatorio) => (
                    <div
                      key={relatorio.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-semibold text-slate-800">
                            {getNomeCelula(relatorio.celula_id)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Líder: <span className="font-semibold">{getNomeUsuario(relatorio.lider_id)}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Dia: <span className="font-semibold">{relatorio.dia_semana_celula || '-'}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Status:{' '}
                            <span className="font-semibold">
                              {relatorio.realizou_celula ? 'Realizada' : 'Não realizada'}
                            </span>
                          </p>
                        </div>

                        <button
                          onClick={() => excluirRelatorio(relatorio.id)}
                          className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                        >
                          Excluir relatório
                        </button>
                      </div>
                    </div>
                  ))}

                  {relatoriosFiltrados.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                      Nenhum relatório encontrado.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 text-sm text-purple-800">
                Esta página remove registros das tabelas do sistema. Para excluir o usuário
                também do Supabase Auth, o ideal é criar uma ação segura no backend.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}