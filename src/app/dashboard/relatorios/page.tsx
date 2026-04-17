'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type PerfilUsuario = {
  id: string
  nome: string
  is_lider?: boolean | null
}

type Celula = {
  id: string
  nome: string
  lider_id: string
  celula_kids_id?: string | null
}

type Membro = {
  id: string
  nome: string
}

type Presenca = {
  membro_id: string
  presente: boolean
}

type ToastType = 'success' | 'error'

export default function DashboardRelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [carregandoCelula, setCarregandoCelula] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [celulaId, setCelulaId] = useState('')
  const [celulaSelecionada, setCelulaSelecionada] = useState<Celula | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [presencas, setPresencas] = useState<Presenca[]>([])

  const [diaSemanaCelula, setDiaSemanaCelula] = useState('')
  const [realizouCelula, setRealizouCelula] = useState(true)
  const [visitantes, setVisitantes] = useState('')
  const [quantidadeCriancas, setQuantidadeCriancas] = useState('')
  const [teveCelulaKids, setTeveCelulaKids] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [motivoNaoRealizacao, setMotivoNaoRealizacao] = useState('')

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'success', visible: false,
  })

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3500)
  }

  // ── Carregamento inicial ─────────────────────────────────────────────────

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)

    async function carregarPagina() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfilData, error: perfilError } = await supabase
        .from('usuarios').select('id, nome, is_lider').eq('id', user.id).single()
      if (perfilError || !perfilData || perfilData.is_lider !== true) { router.push('/dashboard'); return }
      setPerfil(perfilData)

      const { data: celulasData, error: celulasError } = await supabase
        .from('celulas').select('id, nome, lider_id, celula_kids_id')
        .eq('lider_id', user.id).order('nome', { ascending: true })

      if (celulasError || !celulasData || celulasData.length === 0) {
        if (window.location.pathname === '/dashboard/relatorios') {
          router.push('/dashboard/celula')
        }
        return
      }

      setCelulas(celulasData)

      // Se só tem uma célula, já seleciona automaticamente
      if (celulasData.length === 1) {
        await carregarMembrosDaCelula(celulasData[0])
        setCelulaId(celulasData[0].id)
      }

      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  // ── Carregar membros ao trocar célula ────────────────────────────────────

  async function carregarMembrosDaCelula(celula: Celula) {
    setCarregandoCelula(true)
    setCelulaSelecionada(celula)
    setMembros([])
    setPresencas([])

    const { data: membrosData } = await supabase
      .from('celula_membros').select('id, nome')
      .eq('celula_id', celula.id).order('criado_em', { ascending: true })

    const listaMembros = membrosData || []
    setMembros(listaMembros)
    setPresencas(listaMembros.map((m) => ({ membro_id: m.id, presente: false })))
    setCarregandoCelula(false)
  }

  async function handleChangeCelula(id: string) {
    setCelulaId(id)
    if (!id) { setCelulaSelecionada(null); setMembros([]); setPresencas([]); return }
    const celula = celulas.find((c) => c.id === id)
    if (celula) await carregarMembrosDaCelula(celula)
  }

  // ── Presença ─────────────────────────────────────────────────────────────

  function togglePresenca(membroId: string) {
    setPresencas((prev) => prev.map((item) => item.membro_id === membroId ? { ...item, presente: !item.presente } : item))
  }

  const totalPresentes = useMemo(() => presencas.filter((p) => p.presente).length, [presencas])
  const temCelulaKidsVinculada = !!celulaSelecionada?.celula_kids_id

  // ── Salvar ────────────────────────────────────────────────────────────────

  async function handleSalvarRelatorio() {
    if (!perfil || !celulaSelecionada) return

    if (!celulaId) { showToast('Selecione uma célula.', 'error'); return }
    if (!diaSemanaCelula) { showToast('Selecione o dia da semana.', 'error'); return }
    if (realizouCelula) {
      if (visitantes === '') { showToast('Preencha os visitantes.', 'error'); return }
      if (quantidadeCriancas === '') { showToast('Preencha a quantidade de crianças.', 'error'); return }
    } else {
      if (!motivoNaoRealizacao) { showToast('Informe o motivo da não realização.', 'error'); return }
    }

    setSalvando(true)

    const hoje = new Date().toISOString().split('T')[0]

    const payload = {
      celula_id: celulaSelecionada.id,
      lider_id: perfil.id,
      data_referencia: hoje,
      dia_semana_celula: diaSemanaCelula,
      realizou_celula: realizouCelula,
      total_presentes: realizouCelula ? totalPresentes : 0,
      visitantes: realizouCelula ? Number(visitantes) : 0,
      quantidade_criancas: realizouCelula ? Number(quantidadeCriancas) : 0,
      teve_celula_kids: realizouCelula && temCelulaKidsVinculada ? teveCelulaKids : null,
      observacoes: realizouCelula ? observacoes : null,
      motivo_nao_realizacao: realizouCelula ? null : motivoNaoRealizacao,
    }

    const { data: relatorioCriado, error } = await supabase.from('relatorios').insert([payload]).select('id').single()
    if (error || !relatorioCriado) { showToast('Erro ao salvar relatório: ' + (error?.message || 'desconhecido'), 'error'); setSalvando(false); return }

    if (realizouCelula && presencas.length > 0) {
      const { error: errorPresencas } = await supabase.from('relatorio_presencas').insert(
        presencas.map((item) => ({ relatorio_id: relatorioCriado.id, membro_id: item.membro_id, presente: item.presente }))
      )
      if (errorPresencas) { showToast('Relatório salvo, mas erro ao salvar presenças.', 'error'); setSalvando(false); return }
    }

    // Reset
    setDiaSemanaCelula(''); setRealizouCelula(true); setVisitantes(''); setQuantidadeCriancas('')
    setTeveCelulaKids(false); setObservacoes(''); setMotivoNaoRealizacao('')
    setPresencas(membros.map((m) => ({ membro_id: m.id, presente: false })))
    setSalvando(false)
    showToast('Relatório enviado com sucesso!', 'success')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-600">Carregando relatórios...</p>
    </div>
  )

  return (
    <>
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

      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 py-6 sm:px-4 sm:py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex justify-center">
          <div className={`w-full max-w-5xl transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl sm:rounded-3xl">

              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-4 text-white sm:px-8 sm:py-6">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Enviar relatório</h1>
                  <p className="text-xs text-blue-50 sm:text-sm">Preencha o relatório semanal da sua célula</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => router.push('/dashboard/relatorios/historico')}
                    className="rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/30 sm:px-4 sm:text-sm">
                    Histórico
                  </button>
                  <button onClick={() => router.push('/dashboard')}
                    className="rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/30 sm:px-4 sm:text-sm">
                    Voltar
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-4 sm:p-8">
                <p className="text-sm text-slate-500">
                  Líder: <span className="font-semibold">{perfil?.nome}</span>
                </p>

                <div className="rounded-2xl border border-slate-200 p-4 sm:p-6">
                  <h2 className="mb-1 text-xl font-bold text-slate-800 sm:text-2xl">Relatório semanal</h2>
                  <p className="mb-5 text-sm text-slate-500">Informe se a célula foi realizada nesta semana.</p>

                  <div className="flex flex-col gap-5">

                    {/* Seleção de célula — só mostra dropdown se tiver mais de uma */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Célula</label>
                      {celulas.length === 1 ? (
                        <input value={celulas[0].nome} disabled
                          className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 outline-none" />
                      ) : (
                        <select value={celulaId} onChange={(e) => handleChangeCelula(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                          <option value="">Selecione a célula...</option>
                          {celulas.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Loading membros */}
                    {carregandoCelula && (
                      <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                        Carregando dados da célula...
                      </div>
                    )}

                    {/* Formulário — só aparece quando célula selecionada */}
                    {celulaSelecionada && !carregandoCelula && (
                      <>
                        {/* Dia da semana */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Quando a célula aconteceu ou deveria ter acontecido?
                          </label>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia) => (
                              <button key={dia} type="button" onClick={() => setDiaSemanaCelula(dia)}
                                className={`rounded-2xl py-2.5 text-xs font-semibold transition ${
                                  diaSemanaCelula === dia ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}>
                                {dia.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                          {diaSemanaCelula && <p className="mt-2 text-xs text-slate-500">Selecionado: <span className="font-semibold">{diaSemanaCelula}</span></p>}
                        </div>

                        {/* Realizou */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Realizou a célula esta semana?</label>
                          <div className="flex gap-3">
                            <button type="button" onClick={() => setRealizouCelula(true)}
                              className={`rounded-2xl px-5 py-3 font-semibold transition ${realizouCelula ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              Sim
                            </button>
                            <button type="button" onClick={() => setRealizouCelula(false)}
                              className={`rounded-2xl px-5 py-3 font-semibold transition ${!realizouCelula ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              Não
                            </button>
                          </div>
                        </div>

                        {realizouCelula ? (
                          <>
                            {/* Lista de presença */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h3 className="text-lg font-bold text-slate-800">Lista de presença</h3>
                                  <p className="text-sm text-slate-500">Marque os membros que participaram</p>
                                </div>
                                <div className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 w-fit">
                                  Presentes: {totalPresentes}
                                </div>
                              </div>

                              {membros.length === 0 ? (
                                <div className="rounded-xl bg-white px-4 py-4 text-sm text-slate-500">
                                  Nenhum membro cadastrado para esta célula.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {membros.map((membro) => {
                                    const presente = presencas.find((p) => p.membro_id === membro.id)?.presente || false
                                    return (
                                      <button key={membro.id} type="button" onClick={() => togglePresenca(membro.id)}
                                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                                          presente ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}>
                                        <p className="font-medium text-slate-800">{membro.nome}</p>
                                        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${presente ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                          {presente ? 'Foi' : 'Não foi'}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Total + Visitantes + Crianças lado a lado no mobile */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              <div className="sm:col-span-1">
                                <label className="mb-1 block text-sm font-medium text-slate-700">Total presentes</label>
                                <input type="number" value={totalPresentes} disabled
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 outline-none" />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Visitantes</label>
                                <input type="number" min="0" value={visitantes} onChange={(e) => setVisitantes(e.target.value)} placeholder="0"
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-sm font-medium text-slate-700">Crianças</label>
                                <input type="number" min="0" value={quantidadeCriancas} onChange={(e) => setQuantidadeCriancas(e.target.value)} placeholder="0"
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                              </div>
                            </div>

                            {temCelulaKidsVinculada && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Teve célula kids?</label>
                                <div className="flex gap-3">
                                  <button type="button" onClick={() => setTeveCelulaKids(true)}
                                    className={`rounded-2xl px-5 py-3 font-semibold transition ${teveCelulaKids ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                    Sim
                                  </button>
                                  <button type="button" onClick={() => setTeveCelulaKids(false)}
                                    className={`rounded-2xl px-5 py-3 font-semibold transition ${!teveCelulaKids ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                    Não
                                  </button>
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
                              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Escreva observações importantes..." rows={4}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Motivo da não realização</label>
                            <textarea value={motivoNaoRealizacao} onChange={(e) => setMotivoNaoRealizacao(e.target.value)}
                              placeholder="Explique por que a célula não foi realizada nesta semana..." rows={4}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                          </div>
                        )}
                      </>
                    )}

                    <button onClick={handleSalvarRelatorio} disabled={salvando || !celulaSelecionada}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 py-4 font-semibold text-white transition hover:from-blue-700 hover:to-sky-600 disabled:opacity-60">
                      {salvando ? 'Enviando...' : 'Enviar relatório'}
                    </button>
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