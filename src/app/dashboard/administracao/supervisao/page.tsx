'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Usuario = {
  id: string
  codigo?: number | null
  nome: string
  email: string
  is_lider?: boolean | null
  is_supervisor?: boolean | null
}

type Celula = {
  id: string
  codigo?: number | null
  nome: string
  lider_id: string | null
  supervisor_id: string | null
  endereco: string | null
  quantidade_pessoas: number | null
  tipo_celula: string | null
  dia_semana: string | null
  atualizado_em: string | null
}

type ToastType = 'success' | 'error'

export default function SupervisaoPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvandoCelulaId, setSalvandoCelulaId] = useState<string | null>(null)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [busca, setBusca] = useState('')

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

      const [{ data: usuariosData }, { data: celulasData }] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, codigo, nome, email, is_lider, is_supervisor')
          .order('nome', { ascending: true }),
        supabase
          .from('celulas')
          .select(
            'id, codigo, nome, lider_id, supervisor_id, endereco, quantidade_pessoas, tipo_celula, dia_semana, atualizado_em'
          )
          .order('nome', { ascending: true }),
      ])

      setUsuarios(usuariosData || [])
      setCelulas(celulasData || [])
      setLoading(false)
    }

    load()
  }, [router, supabase])

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3500)
  }

  const supervisores = useMemo(() => {
    return usuarios.filter((u) => u.is_supervisor === true)
  }, [usuarios])

  const celulasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return celulas.filter((celula) => {
      const lider = usuarios.find((u) => u.id === celula.lider_id)
      const supervisor = usuarios.find((u) => u.id === celula.supervisor_id)
      return (
        celula.nome.toLowerCase().includes(termo) ||
        (lider?.nome || '').toLowerCase().includes(termo) ||
        (supervisor?.nome || '').toLowerCase().includes(termo)
      )
    })
  }, [busca, celulas, usuarios])

  const totalCelulas = celulas.length
  const celulasSemSupervisor = celulas.filter((c) => !c.supervisor_id).length
  const totalSupervisores = supervisores.length

  function getCorTipoCelula(tipo: string | null) {
    switch (tipo?.toLowerCase()) {
      case 'adultos': return 'bg-green-100 text-green-800'
      case 'jovens': return 'bg-blue-100 text-blue-800'
      case 'adolescentes': return 'bg-purple-100 text-purple-800'
      case 'crianças': return 'bg-pink-100 text-pink-800'
      case 'casais': return 'bg-amber-100 text-amber-800'
      case 'homens': return 'bg-cyan-100 text-cyan-800'
      case 'mulheres': return 'bg-rose-100 text-rose-800'
      case 'mista': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  function getNomeUsuario(id: string | null) {
    if (!id) return 'Não definido'
    return usuarios.find((u) => u.id === id)?.nome ?? 'Não encontrado'
  }

  async function atualizarSupervisorDaCelula(celulaId: string, supervisorId: string) {
    setSalvandoCelulaId(celulaId)

    const valorFinal = supervisorId === '' ? null : supervisorId

    const { error } = await supabase
      .from('celulas')
      .update({ supervisor_id: valorFinal })
      .eq('id', celulaId)

    if (error) {
      showToast('Erro ao atualizar supervisor da célula.', 'error')
      setSalvandoCelulaId(null)
      return
    }

    setCelulas((atuais) =>
      atuais.map((celula) =>
        celula.id === celulaId ? { ...celula, supervisor_id: valorFinal } : celula
      )
    )

    const nomeSupervisor = valorFinal ? getNomeUsuario(valorFinal) : null
    showToast(
      nomeSupervisor
        ? `Supervisor atualizado para ${nomeSupervisor}.`
        : 'Supervisor removido da célula.',
      'success'
    )

    setSalvandoCelulaId(null)
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
            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${toast.type === 'success' ? 'bg-green-200' : 'bg-red-200'}`} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex justify-center">
          <div
            className={`w-full max-w-7xl transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

              {/* Header */}
              <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-6 text-white sm:px-8">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Atribuir supervisão</h1>
                  <p className="mt-1 text-sm text-orange-50">
                    Defina qual supervisor acompanha cada célula
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/administracao')}
                  className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30"
                >
                  Voltar
                </button>
              </div>

              <div className="space-y-5 p-4 sm:space-y-6 sm:p-8">

                {/* Métricas */}
                <div className="flex gap-2 md:grid md:grid-cols-3 md:gap-4">
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-center md:p-5 md:text-left">
                    <p className="text-xs text-slate-500 md:text-sm">Total de células</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-800 md:mt-2 md:text-3xl">
                      {totalCelulas}
                    </h2>
                  </div>

                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-center md:p-5 md:text-left">
                    <p className="text-xs text-slate-500 md:text-sm">Supervisores ativos</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-800 md:mt-2 md:text-3xl">
                      {totalSupervisores}
                    </h2>
                  </div>

                  <div className={`flex-1 rounded-2xl border p-3 shadow-sm text-center md:p-5 md:text-left ${
                    celulasSemSupervisor > 0
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <p className={`text-xs md:text-sm ${celulasSemSupervisor > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
                      Sem supervisor
                    </p>
                    <h2 className={`mt-1 text-xl font-bold md:mt-2 md:text-3xl ${
                      celulasSemSupervisor > 0 ? 'text-orange-600' : 'text-slate-800'
                    }`}>
                      {celulasSemSupervisor}
                    </h2>
                  </div>
                </div>

                {/* Lista de células */}
                <div className="rounded-2xl border border-slate-200 p-4 sm:p-6">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Células</h2>
                      <p className="text-sm text-slate-500">
                        Pesquise por célula, líder ou supervisor
                      </p>
                    </div>
                    <input
                      placeholder="Buscar..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none md:max-w-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  <div className="grid gap-4">
                    {celulasFiltradas.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                        Nenhuma célula encontrada.
                      </div>
                    ) : (
                      celulasFiltradas.map((celula) => (
                        <div
                          key={celula.id}
                          className={`overflow-hidden rounded-2xl border ${
                            !celula.supervisor_id ? 'border-orange-200' : 'border-slate-200'
                          }`}
                        >
                          {/* Mobile */}
                          <div className="flex items-start justify-between border-b border-slate-100 p-4 md:hidden">
                            <div>
                              <p className="font-semibold text-slate-800">{celula.nome}</p>
                              <p className="mt-0.5 text-sm text-slate-500">
                                {getNomeUsuario(celula.lider_id)}
                              </p>
                            </div>
                            <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
                              {celula.tipo_celula && (
                                <span className={`rounded-md px-2 py-1 text-xs ${getCorTipoCelula(celula.tipo_celula)}`}>
                                  {celula.tipo_celula}
                                </span>
                              )}
                              {celula.dia_semana && (
                                <span className="text-xs text-slate-500">{celula.dia_semana}</span>
                              )}
                            </div>
                          </div>

                          {/* Desktop */}
                          <div className="hidden gap-4 p-5 md:grid md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-sm text-slate-500">Célula</p>
                              <p className="font-semibold text-slate-800">{celula.nome}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Líder</p>
                              <p className="break-words font-semibold text-slate-800">
                                {getNomeUsuario(celula.lider_id)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Tipo</p>
                              <p className="font-semibold text-slate-800">{celula.tipo_celula || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Dia</p>
                              <p className="font-semibold text-slate-800">{celula.dia_semana || '-'}</p>
                            </div>
                          </div>

                          {/* Select supervisor */}
                          <div className="p-4 md:px-5 md:pb-5 md:pt-0">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Supervisor responsável
                            </label>
                            <select
                              value={celula.supervisor_id || ''}
                              onChange={(e) => atualizarSupervisorDaCelula(celula.id, e.target.value)}
                              disabled={salvandoCelulaId === celula.id}
                              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:opacity-60 ${
                                !celula.supervisor_id
                                  ? 'border-orange-200 bg-orange-50'
                                  : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <option value="">Sem supervisor</option>
                              {supervisores.map((supervisor) => (
                                <option key={supervisor.id} value={supervisor.id}>
                                  {supervisor.nome}
                                </option>
                              ))}
                            </select>

                            <p className="mt-2 text-xs text-slate-400">
                              {salvandoCelulaId === celula.id
                                ? 'Salvando...'
                                : celula.atualizado_em
                                ? `Atualizado em ${new Date(celula.atualizado_em).toLocaleString('pt-BR', {
                                    timeZone: 'America/Sao_Paulo',
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}`
                                : 'Nunca atualizado'}
                            </p>
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
      </div>
    </>
  )
}