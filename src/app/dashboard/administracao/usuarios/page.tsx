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
  max_celulas?: number | null
}

type ToastType = 'success' | 'error'

export default function AdministracaoUsuariosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')

  // Modal de configuração de líder
  const [modalLider, setModalLider] = useState<Usuario | null>(null)
  const [maxCelulasTemp, setMaxCelulasTemp] = useState('1')
  const [salvandoLider, setSalvandoLider] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'success', visible: false,
  })

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('usuarios').select('is_secretaria, is_super_admin').eq('id', user.id).single()
      if (!perfil || (!perfil.is_secretaria && !perfil.is_super_admin)) { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('usuarios').select('*').order('nome', { ascending: true })
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

  const totalLideres = useMemo(() => usuarios.filter((u) => u.is_lider).length, [usuarios])
  const totalSupervisores = useMemo(() => usuarios.filter((u) => u.is_supervisor).length, [usuarios])

  // ── Tornar / remover supervisor ──────────────────────────────────────────

  async function toggleSupervisor(usuario: Usuario) {
    const novoValor = !usuario.is_supervisor
    const { error } = await supabase.from('usuarios').update({ is_supervisor: novoValor }).eq('id', usuario.id)
    if (error) { showToast('Erro ao atualizar permissão.', 'error'); return }
    setUsuarios((prev) => prev.map((u) => u.id === usuario.id ? { ...u, is_supervisor: novoValor } : u))
    showToast(novoValor ? 'Permissão de Supervisor concedida!' : 'Permissão de Supervisor removida.', 'success')
  }

  // ── Abrir modal para configurar líder ────────────────────────────────────

  function abrirModalLider(usuario: Usuario) {
    setModalLider(usuario)
    setMaxCelulasTemp(String(usuario.max_celulas ?? 1))
  }

  // ── Confirmar tornar líder (com max_celulas) ──────────────────────────────

  async function confirmarTornarLider() {
    if (!modalLider) return
    const max = Math.max(1, Number(maxCelulasTemp) || 1)
    setSalvandoLider(true)
    const { error } = await supabase.from('usuarios')
      .update({ is_lider: true, max_celulas: max }).eq('id', modalLider.id)
    if (error) { showToast('Erro ao atualizar permissão.', 'error'); setSalvandoLider(false); return }
    setUsuarios((prev) => prev.map((u) => u.id === modalLider.id ? { ...u, is_lider: true, max_celulas: max } : u))
    showToast(`Permissão de Líder concedida! Limite: ${max} célula(s).`, 'success')
    setModalLider(null)
    setSalvandoLider(false)
  }

  // ── Remover líder ─────────────────────────────────────────────────────────

  async function removerLider(usuario: Usuario) {
    const { error } = await supabase.from('usuarios')
      .update({ is_lider: false, max_celulas: 1 }).eq('id', usuario.id)
    if (error) { showToast('Erro ao remover permissão.', 'error'); return }
    setUsuarios((prev) => prev.map((u) => u.id === usuario.id ? { ...u, is_lider: false, max_celulas: 1 } : u))
    showToast('Permissão de Líder removida.', 'success')
  }

  // ── Editar max_celulas de líder já existente ──────────────────────────────

  async function salvarMaxCelulas() {
    if (!modalLider) return
    const max = Math.max(1, Number(maxCelulasTemp) || 1)
    setSalvandoLider(true)
    const { error } = await supabase.from('usuarios').update({ max_celulas: max }).eq('id', modalLider.id)
    if (error) { showToast('Erro ao atualizar limite.', 'error'); setSalvandoLider(false); return }
    setUsuarios((prev) => prev.map((u) => u.id === modalLider.id ? { ...u, max_celulas: max } : u))
    showToast(`Limite atualizado para ${max} célula(s).`, 'success')
    setModalLider(null)
    setSalvandoLider(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-600">Carregando...</p>
    </div>
  )

  return (
    <>
      {/* Toast */}
      {toast.visible && (
        <div className={`fixed right-3 top-3 z-50 w-[calc(100vw-24px)] max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 sm:right-5 sm:top-5 sm:w-auto sm:min-w-[280px] ${
          toast.type === 'success' ? 'border-green-200 bg-green-600 text-white' : 'border-red-200 bg-red-500 text-white'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${toast.type === 'success' ? 'bg-green-200' : 'bg-red-200'}`} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Modal configurar líder */}
      {modalLider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800">
              {modalLider.is_lider ? 'Editar limite de células' : 'Tornar Líder'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {modalLider.nome}
            </p>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">
                Quantas células este líder pode ter?
              </label>
              <div className="mt-2 flex items-center gap-3">
                <button type="button"
                  onClick={() => setMaxCelulasTemp(String(Math.max(1, Number(maxCelulasTemp) - 1)))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-700 transition hover:bg-slate-200">
                  −
                </button>
                <input type="number" min="1" max="10" value={maxCelulasTemp}
                  onChange={(e) => setMaxCelulasTemp(e.target.value)}
                  className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-lg font-bold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100" />
                <button type="button"
                  onClick={() => setMaxCelulasTemp(String(Math.min(10, Number(maxCelulasTemp) + 1)))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-700 transition hover:bg-slate-200">
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                O padrão é 1. Aumente para líderes com múltiplas células.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setModalLider(null)} disabled={salvandoLider}
                className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60">
                Cancelar
              </button>
              <button
                onClick={modalLider.is_lider ? salvarMaxCelulas : confirmarTornarLider}
                disabled={salvandoLider}
                className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                {salvandoLider ? 'Salvando...' : modalLider.is_lider ? 'Salvar limite' : 'Tornar Líder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Página */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 py-6 sm:px-4 sm:py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex justify-center">
          <div className={`w-full max-w-6xl transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl sm:rounded-3xl">

              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 text-white sm:px-8 sm:py-6">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Usuários e Permissões</h1>
                  <p className="text-xs text-orange-50 sm:text-sm">Gerencie líderes e supervisores do sistema</p>
                </div>
                <button onClick={() => router.push('/dashboard/administracao')}
                  className="rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold transition hover:bg-white/30">
                  Voltar
                </button>
              </div>

              <div className="space-y-5 p-4 sm:p-8">

                {/* Cards resumo */}
                <div className="grid gap-3 grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm sm:p-5">
                    <p className="text-xs text-slate-500">Total</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-800 sm:mt-2 sm:text-3xl">{usuarios.length}</h2>
                  </div>
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-3 shadow-sm sm:p-5">
                    <p className="text-xs text-slate-500">Líderes</p>
                    <h2 className="mt-1 text-2xl font-bold text-green-700 sm:mt-2 sm:text-3xl">{totalLideres}</h2>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 shadow-sm sm:p-5">
                    <p className="text-xs text-slate-500">Supervisores</p>
                    <h2 className="mt-1 text-2xl font-bold text-blue-700 sm:mt-2 sm:text-3xl">{totalSupervisores}</h2>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input placeholder="Buscar por nome ou e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                  <select value={filtro} onChange={(e) => setFiltro(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                    <option value="todos">Todos</option>
                    <option value="lider">Líderes</option>
                    <option value="supervisor">Supervisores</option>
                  </select>
                </div>

                <p className="text-sm text-slate-500">{usuariosFiltrados.length} usuário(s) encontrado(s)</p>

                {/* Lista */}
                <div className="space-y-3">
                  {usuariosFiltrados.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Nenhum usuário encontrado.</div>
                  ) : (
                    usuariosFiltrados.map((user) => (
                      <div key={user.id} className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-md sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold leading-tight text-slate-800 sm:text-lg">{user.nome}</p>
                            <p className="mt-0.5 break-all text-xs text-slate-500 sm:text-sm">{user.email}</p>

                            {/* Badges */}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {user.is_lider && (
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                  Líder · {user.max_celulas ?? 1} célula(s)
                                </span>
                              )}
                              {user.is_supervisor && (
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Supervisor</span>
                              )}
                              {user.is_secretaria && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Administração</span>
                              )}
                              {user.is_super_admin && (
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">Super Admin</span>
                              )}
                              {!user.is_lider && !user.is_supervisor && !user.is_secretaria && !user.is_super_admin && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Usuário comum</span>
                              )}
                            </div>
                          </div>

                          {/* Botões */}
                          <div className="flex flex-wrap gap-2">
                            {/* Líder */}
                            {user.is_lider ? (
                              <div className="flex gap-2">
                                <button onClick={() => abrirModalLider(user)}
                                  className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 sm:px-4">
                                  ✏️ Limite
                                </button>
                                <button onClick={() => removerLider(user)}
                                  className="rounded-xl bg-red-500 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600 sm:px-4">
                                  Remover Líder
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => abrirModalLider(user)}
                                className="rounded-xl bg-green-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 sm:px-4">
                                Tornar Líder
                              </button>
                            )}

                            {/* Supervisor */}
                            <button onClick={() => toggleSupervisor(user)}
                              className={`rounded-xl px-3 py-2.5 text-xs font-semibold text-white transition sm:px-4 ${
                                user.is_supervisor ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                              }`}>
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