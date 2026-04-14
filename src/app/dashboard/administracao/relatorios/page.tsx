'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type PerfilUsuario = {
  id: string
  nome: string
  is_secretaria?: boolean | null
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
  criado_em: string
  atualizado_em: string
}

type Relatorio = {
  id: string
  celula_id: string
  lider_id: string
  data_referencia: string
  dia_semana_celula: string | null
  realizou_celula: boolean | null
  total_presentes: number | null
  visitantes: number | null
  quantidade_criancas: number | null
  teve_celula_kids: boolean | null
  observacoes: string | null
  motivo_nao_realizacao: string | null
  criado_em: string
}

type Usuario = {
  id: string
  nome: string
  email: string
  telefone?: string | null
}

type ToastType = 'success' | 'error'
type Aba = 'bi' | 'relatorios' | 'celulas'
type AbaBI = 'analitico' | 'sintetico'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInicioSemana(): string {
  const hoje = new Date()
  const diaSemana = hoje.getDay()
  const diff = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)
  const segunda = new Date(hoje.setDate(diff))
  return segunda.toISOString().split('T')[0]
}

function getFimSemana(): string {
  const inicio = new Date(getInicioSemana())
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  return fim.toISOString().split('T')[0]
}

function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '')
  return numeros.startsWith('55') ? numeros : `55${numeros}`
}

const MENSAGEM_WHATSAPP = encodeURIComponent(
  'Olá! Vi que ainda não enviou o relatório de célula dessa semana. Lembre-se de realizá-lo, ele é muito importante para andarmos em unidade!'
)

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdministracaoRelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const [abaAtiva, setAbaAtiva] = useState<Aba>('bi')
  const [abaBIAtiva, setAbaBIAtiva] = useState<AbaBI>('sintetico')

  const [buscaRelatorio, setBuscaRelatorio] = useState('')
  const [filtroRealizacao, setFiltroRealizacao] = useState('todos')
  const [buscaCelula, setBuscaCelula] = useState('')

  const [relatorioParaExcluir, setRelatorioParaExcluir] = useState<Relatorio | null>(null)
  const [excluindoRelatorio, setExcluindoRelatorio] = useState(false)

  const [celulaParaExcluir, setCelulaParaExcluir] = useState<Celula | null>(null)
  const [confirmacaoNomeCelula, setConfirmacaoNomeCelula] = useState('')
  const [excluindoCelula, setExcluindoCelula] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'success', visible: false,
  })

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)

    async function carregarPagina() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfilData } = await supabase
        .from('usuarios').select('id, nome, is_secretaria').eq('id', user.id).single()
      if (!perfilData?.is_secretaria) { router.push('/dashboard'); return }
      setPerfil(perfilData)

      const [
        { data: usuariosData },
        { data: celulasData },
        { data: relatoriosData },
      ] = await Promise.all([
        supabase.from('usuarios').select('id, nome, email, telefone').order('nome', { ascending: true }),
        supabase.from('celulas').select('*').order('nome', { ascending: true }),
        supabase.from('relatorios').select('*').order('criado_em', { ascending: false }),
      ])

      setUsuarios(usuariosData || [])
      setCelulas(celulasData || [])
      setRelatorios(relatoriosData || [])
      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3500)
  }

  function getNomeUsuario(id: string | null) {
    if (!id) return 'Não definido'
    return usuarios.find((u) => u.id === id)?.nome ?? 'Não encontrado'
  }

  function getTelefoneUsuario(id: string | null): string | null {
    if (!id) return null
    return usuarios.find((u) => u.id === id)?.telefone ?? null
  }

  function getNomeCelula(id: string) {
    return celulas.find((c) => c.id === id)?.nome ?? 'Célula não encontrada'
  }

  function abrirWhatsApp(liderId: string | null) {
    const telefone = getTelefoneUsuario(liderId)
    if (!telefone) {
      showToast('Líder não possui telefone cadastrado.', 'error')
      return
    }
    const numero = formatarTelefone(telefone)
    window.open(`https://wa.me/${numero}?text=${MENSAGEM_WHATSAPP}`, '_blank')
  }

  // ─── B.I ──────────────────────────────────────────────────────────────────

  const inicioSemana = getInicioSemana()
  const fimSemana = getFimSemana()

  const relatoriosSemana = useMemo(() =>
    relatorios.filter((r) => r.data_referencia >= inicioSemana && r.data_referencia <= fimSemana),
  [relatorios, inicioSemana, fimSemana])

  const celulasSemRelatorio = useMemo(() => {
    const ids = new Set(relatoriosSemana.map((r) => r.celula_id))
    return celulas.filter((c) => !ids.has(c.id))
  }, [relatoriosSemana, celulas])

  const totalPresentesSemana = useMemo(() =>
    relatoriosSemana.filter((r) => r.realizou_celula).reduce((acc, r) => acc + (r.total_presentes ?? 0), 0),
  [relatoriosSemana])

  const totalCriancasSemana = useMemo(() =>
    relatoriosSemana.filter((r) => r.realizou_celula).reduce((acc, r) => acc + (r.quantidade_criancas ?? 0), 0),
  [relatoriosSemana])

  const totalVisitantesSemana = useMemo(() =>
    relatoriosSemana.filter((r) => r.realizou_celula).reduce((acc, r) => acc + (r.visitantes ?? 0), 0),
  [relatoriosSemana])

  const totalRealizadasSemana = relatoriosSemana.filter((r) => r.realizou_celula).length
  const totalNaoRealizadasSemana = relatoriosSemana.filter((r) => !r.realizou_celula).length

  // ─── Filtros ──────────────────────────────────────────────────────────────

  const relatoriosFiltrados = useMemo(() => {
    let lista = relatorios
    if (buscaRelatorio.trim()) {
      const termo = buscaRelatorio.toLowerCase()
      lista = lista.filter((r) =>
        getNomeCelula(r.celula_id).toLowerCase().includes(termo) ||
        getNomeUsuario(r.lider_id).toLowerCase().includes(termo)
      )
    }
    if (filtroRealizacao === 'realizadas') lista = lista.filter((r) => r.realizou_celula)
    if (filtroRealizacao === 'nao-realizadas') lista = lista.filter((r) => !r.realizou_celula)
    return lista
  }, [relatorios, buscaRelatorio, filtroRealizacao])

  const celulasFiltradas = useMemo(() => {
    if (!buscaCelula.trim()) return celulas
    const termo = buscaCelula.toLowerCase()
    return celulas.filter((c) =>
      c.nome.toLowerCase().includes(termo) ||
      getNomeUsuario(c.lider_id).toLowerCase().includes(termo)
    )
  }, [celulas, buscaCelula])

  // ─── Exclusões ────────────────────────────────────────────────────────────

  async function confirmarExclusaoRelatorio() {
    if (!relatorioParaExcluir) return
    setExcluindoRelatorio(true)
    await supabase.from('relatorio_presencas').delete().eq('relatorio_id', relatorioParaExcluir.id)
    const { error } = await supabase.from('relatorios').delete().eq('id', relatorioParaExcluir.id)
    if (error) { showToast('Erro ao excluir relatório.', 'error') }
    else {
      setRelatorios((prev) => prev.filter((r) => r.id !== relatorioParaExcluir.id))
      showToast('Relatório excluído com sucesso!', 'success')
    }
    setRelatorioParaExcluir(null)
    setExcluindoRelatorio(false)
  }

  async function confirmarExclusaoCelula() {
    if (!celulaParaExcluir) return
    if (confirmacaoNomeCelula.trim() !== celulaParaExcluir.nome.trim()) {
      showToast('O nome digitado não confere.', 'error'); return
    }
    setExcluindoCelula(true)
    const relsDaCelula = relatorios.filter((r) => r.celula_id === celulaParaExcluir.id)
    for (const rel of relsDaCelula) {
      await supabase.from('relatorio_presencas').delete().eq('relatorio_id', rel.id)
    }
    await supabase.from('relatorios').delete().eq('celula_id', celulaParaExcluir.id)
    await supabase.from('celula_membros').delete().eq('celula_id', celulaParaExcluir.id)
    const { error } = await supabase.from('celulas').delete().eq('id', celulaParaExcluir.id)
    if (error) { showToast('Erro ao excluir célula.', 'error') }
    else {
      setCelulas((prev) => prev.filter((c) => c.id !== celulaParaExcluir.id))
      setRelatorios((prev) => prev.filter((r) => r.celula_id !== celulaParaExcluir.id))
      showToast('Célula excluída com sucesso!', 'success')
    }
    setCelulaParaExcluir(null)
    setConfirmacaoNomeCelula('')
    setExcluindoCelula(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando...</p>
      </div>
    )
  }

  const abas: { key: Aba; label: string; cor: string }[] = [
    { key: 'bi', label: '📊 Business Intelligence', cor: 'bg-orange-500' },
    { key: 'relatorios', label: '🗑️ Excluir Relatórios', cor: 'bg-red-500' },
    { key: 'celulas', label: '🏠 Excluir Células', cor: 'bg-red-700' },
  ]

  return (
    <>
      {/* Toast */}
      {toast.visible && (
        <div className={`fixed right-5 top-5 z-50 min-w-[280px] max-w-sm rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-md transition-all duration-300 ${
          toast.type === 'success' ? 'border-green-200 bg-green-600 text-white' : 'border-red-200 bg-red-500 text-white'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${toast.type === 'success' ? 'bg-green-200' : 'bg-red-200'}`} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Modal Excluir Relatório */}
      {relatorioParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800">Excluir relatório</h3>
            <p className="mt-2 text-sm text-slate-500">
              Tem certeza que deseja excluir o relatório da célula{' '}
              <span className="font-semibold text-slate-700">{getNomeCelula(relatorioParaExcluir.celula_id)}</span>{' '}
              de{' '}
              <span className="font-semibold text-slate-700">
                {new Date(relatorioParaExcluir.data_referencia).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </span>? Esta ação é irreversível e também removerá as presenças vinculadas.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setRelatorioParaExcluir(null)} disabled={excluindoRelatorio}
                className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={confirmarExclusaoRelatorio} disabled={excluindoRelatorio}
                className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">
                {excluindoRelatorio ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Célula */}
      {celulaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">⚠️</div>
              <h3 className="text-xl font-bold text-slate-800">Excluir célula</h3>
            </div>
            <p className="text-sm text-slate-500">
              Você está prestes a excluir permanentemente a célula{' '}
              <span className="font-semibold text-red-600">{celulaParaExcluir.nome}</span>.
              Isso também removerá <span className="font-semibold">todos os relatórios</span>,{' '}
              <span className="font-semibold">presenças</span> e <span className="font-semibold">membros</span> vinculados.
            </p>
            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">Para confirmar, digite o nome exato da célula:</label>
              <p className="mt-1 rounded-xl bg-slate-50 px-4 py-2 font-mono text-sm font-semibold text-slate-800">
                {celulaParaExcluir.nome}
              </p>
              <input value={confirmacaoNomeCelula} onChange={(e) => setConfirmacaoNomeCelula(e.target.value)}
                placeholder="Digite o nome aqui..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50" />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => { setCelulaParaExcluir(null); setConfirmacaoNomeCelula('') }} disabled={excluindoCelula}
                className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={confirmarExclusaoCelula}
                disabled={excluindoCelula || confirmacaoNomeCelula.trim() !== celulaParaExcluir.nome.trim()}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-40">
                {excluindoCelula ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Página principal */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex justify-center">
          <div className={`w-full max-w-7xl transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
                <div>
                  <h1 className="text-3xl font-bold">Relatórios</h1>
                  <p className="text-sm text-orange-100">Análises, exclusão de relatórios e células</p>
                </div>
                <button onClick={() => router.push('/dashboard/administracao')}
                  className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30">
                  Voltar
                </button>
              </div>

              <div className="p-8">
                <p className="mb-6 text-sm text-slate-500">
                  Administrador: <span className="font-semibold">{perfil?.nome}</span>
                </p>

                {/* Tabs */}
                <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                  {abas.map((aba) => (
                    <button key={aba.key} onClick={() => setAbaAtiva(aba.key)}
                      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        abaAtiva === aba.key ? `${aba.cor} text-white shadow-md` : 'text-slate-600 hover:bg-white hover:shadow-sm'
                      }`}>
                      {aba.label}
                    </button>
                  ))}
                </div>

                {/* ── ABA: B.I ── */}
                {abaAtiva === 'bi' && (
                  <div>
                    <div className="mb-6 flex max-w-sm gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                      {(['sintetico', 'analitico'] as AbaBI[]).map((tab) => (
                        <button key={tab} onClick={() => setAbaBIAtiva(tab)}
                          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                            abaBIAtiva === tab ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:bg-white'
                          }`}>
                          {tab === 'sintetico' ? 'Sintético' : 'Analítico'}
                        </button>
                      ))}
                    </div>

                    <p className="mb-4 text-xs text-slate-400">
                      Semana atual: {new Date(inicioSemana + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                      {new Date(fimSemana + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>

                    {/* Sintético */}
                    {abaBIAtiva === 'sintetico' && (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                          {[
                            { label: 'Total de células', valor: celulas.length, bg: 'bg-slate-50', texto: 'text-slate-800' },
                            { label: 'Relatórios enviados', valor: relatoriosSemana.length, bg: 'bg-orange-50', texto: 'text-orange-700' },
                            { label: 'Células que realizaram', valor: totalRealizadasSemana, bg: 'bg-green-50', texto: 'text-green-700' },
                            { label: 'Não realizaram (com relatório)', valor: totalNaoRealizadasSemana, bg: 'bg-red-50', texto: 'text-red-700' },
                            { label: 'Sem relatório esta semana', valor: celulasSemRelatorio.length, bg: 'bg-yellow-50', texto: 'text-yellow-700' },
                            { label: 'Relatórios faltando', valor: celulas.length - relatoriosSemana.length, bg: 'bg-amber-50', texto: 'text-amber-700' },
                          ].map((card) => (
                            <div key={card.label} className={`rounded-2xl border border-slate-200 ${card.bg} p-5 shadow-sm`}>
                              <p className="text-xs text-slate-500">{card.label}</p>
                              <h2 className={`mt-2 text-3xl font-bold ${card.texto}`}>{card.valor}</h2>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          {[
                            { label: 'Pessoas presentes na semana', valor: totalPresentesSemana, icon: '👥', bg: 'bg-blue-50', texto: 'text-blue-700' },
                            { label: 'Crianças na semana', valor: totalCriancasSemana, icon: '🧒', bg: 'bg-pink-50', texto: 'text-pink-700' },
                            { label: 'Visitantes na semana', valor: totalVisitantesSemana, icon: '🙋', bg: 'bg-purple-50', texto: 'text-purple-700' },
                          ].map((card) => (
                            <div key={card.label} className={`rounded-2xl border border-slate-200 ${card.bg} p-6 shadow-sm`}>
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{card.icon}</span>
                                <div>
                                  <p className="text-xs text-slate-500">{card.label}</p>
                                  <h2 className={`mt-1 text-4xl font-bold ${card.texto}`}>{card.valor}</h2>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ── Células sem relatório — com botão WhatsApp ── */}
                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                          <h3 className="mb-4 text-lg font-bold text-yellow-800">
                            ⚠️ Células sem relatório esta semana ({celulasSemRelatorio.length})
                          </h3>
                          {celulasSemRelatorio.length === 0 ? (
                            <p className="text-sm font-medium text-yellow-700">
                              ✅ Todas as células já enviaram relatório esta semana!
                            </p>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {celulasSemRelatorio.map((celula) => {
                                const temTelefone = !!getTelefoneUsuario(celula.lider_id)
                                return (
                                  <div key={celula.id} className="rounded-xl border border-yellow-200 bg-white p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-slate-800">{celula.nome}</p>
                                        <p className="mt-1 truncate text-xs text-slate-500">
                                          Líder: {getNomeUsuario(celula.lider_id)}
                                        </p>
                                        {celula.dia_semana && (
                                          <p className="mt-0.5 text-xs text-slate-500">Dia: {celula.dia_semana}</p>
                                        )}
                                      </div>

                                      {/* Botão WhatsApp com tooltip */}
                                      <div className="group relative shrink-0">
                                        <button
                                          onClick={() => abrirWhatsApp(celula.lider_id)}
                                          className={`flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 ${
                                            temTelefone
                                              ? 'bg-green-500 text-white hover:bg-green-600'
                                              : 'cursor-not-allowed bg-slate-200 text-slate-400'
                                          }`}
                                        >
                                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                          </svg>
                                        </button>

                                        {/* Tooltip */}
                                        <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-52 rounded-xl bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                                          {temTelefone
                                            ? 'Cobrar relatório pelo WhatsApp'
                                            : 'Líder sem telefone cadastrado'}
                                          {/* Setinha do tooltip */}
                                          <div className="absolute right-3 top-full h-2 w-2 -translate-y-0.5 rotate-45 bg-slate-800" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Analítico */}
                    {abaBIAtiva === 'analitico' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 p-5">
                          <h3 className="mb-4 text-lg font-bold text-slate-800">Detalhamento por célula — semana atual</h3>
                          {relatoriosSemana.length === 0 ? (
                            <p className="text-sm text-slate-500">Nenhum relatório enviado esta semana ainda.</p>
                          ) : (
                            <div className="space-y-3">
                              {relatoriosSemana.map((relatorio) => (
                                <div key={relatorio.id} className="rounded-2xl border border-slate-200 p-5">
                                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <p className="font-bold text-slate-800">{getNomeCelula(relatorio.celula_id)}</p>
                                      <p className="text-xs text-slate-500">Líder: {getNomeUsuario(relatorio.lider_id)}</p>
                                    </div>
                                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                      relatorio.realizou_celula ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {relatorio.realizou_celula ? 'Realizada' : 'Não realizada'}
                                    </span>
                                  </div>
                                  {relatorio.realizou_celula ? (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                      {[
                                        { label: 'Presentes', valor: relatorio.total_presentes ?? 0 },
                                        { label: 'Visitantes', valor: relatorio.visitantes ?? 0 },
                                        { label: 'Crianças', valor: relatorio.quantidade_criancas ?? 0 },
                                        { label: 'Célula Kids', valor: relatorio.teve_celula_kids === null ? '-' : relatorio.teve_celula_kids ? 'Sim' : 'Não' },
                                      ].map((item) => (
                                        <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                                          <p className="text-xs text-slate-500">{item.label}</p>
                                          <p className="mt-1 text-lg font-bold text-slate-800">{item.valor}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="mt-3 rounded-xl bg-red-50 p-3">
                                      <p className="text-xs text-slate-500">Motivo</p>
                                      <p className="mt-1 text-sm text-slate-700">{relatorio.motivo_nao_realizacao || '-'}</p>
                                    </div>
                                  )}
                                  {relatorio.realizou_celula && relatorio.observacoes && (
                                    <div className="mt-3 rounded-xl bg-blue-50 p-3">
                                      <p className="text-xs text-slate-500">Observações</p>
                                      <p className="mt-1 text-sm text-slate-700">{relatorio.observacoes}</p>
                                    </div>
                                  )}
                                  <p className="mt-3 text-xs text-slate-400">
                                    Enviado em:{' '}
                                    {new Date(relatorio.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-200 p-5">
                          <h3 className="mb-4 text-lg font-bold text-slate-800">Consolidado histórico geral</h3>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                                <th className="pb-3 pr-4">Célula</th>
                                <th className="pb-3 pr-4">Líder</th>
                                <th className="pb-3 pr-4 text-center">Total</th>
                                <th className="pb-3 pr-4 text-center">Realizadas</th>
                                <th className="pb-3 pr-4 text-center">Não realizadas</th>
                                <th className="pb-3 text-center">Presentes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {celulas.map((celula) => {
                                const rels = relatorios.filter((r) => r.celula_id === celula.id)
                                const realizadas = rels.filter((r) => r.realizou_celula).length
                                const naoRealizadas = rels.filter((r) => !r.realizou_celula).length
                                const totalPresentes = rels.filter((r) => r.realizou_celula).reduce((acc, r) => acc + (r.total_presentes ?? 0), 0)
                                return (
                                  <tr key={celula.id} className="border-b border-slate-100 last:border-0">
                                    <td className="py-3 pr-4 font-medium text-slate-800">{celula.nome}</td>
                                    <td className="py-3 pr-4 text-slate-500">{getNomeUsuario(celula.lider_id)}</td>
                                    <td className="py-3 pr-4 text-center text-slate-700">{rels.length}</td>
                                    <td className="py-3 pr-4 text-center font-semibold text-green-600">{realizadas}</td>
                                    <td className="py-3 pr-4 text-center font-semibold text-red-500">{naoRealizadas}</td>
                                    <td className="py-3 text-center font-semibold text-blue-600">{totalPresentes}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ABA: Excluir Relatórios */}
                {abaAtiva === 'relatorios' && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                      ⚠️ A exclusão de um relatório é irreversível. As presenças vinculadas também serão removidas.
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input placeholder="Buscar por célula ou líder..." value={buscaRelatorio}
                        onChange={(e) => setBuscaRelatorio(e.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50" />
                      <select value={filtroRealizacao} onChange={(e) => setFiltroRealizacao(e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50">
                        <option value="todos">Todos</option>
                        <option value="realizadas">Só realizadas</option>
                        <option value="nao-realizadas">Só não realizadas</option>
                      </select>
                    </div>
                    <p className="text-sm text-slate-500">{relatoriosFiltrados.length} relatório(s) encontrado(s)</p>
                    <div className="space-y-3">
                      {relatoriosFiltrados.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Nenhum relatório encontrado.</div>
                      ) : (
                        relatoriosFiltrados.map((relatorio) => (
                          <div key={relatorio.id} className="rounded-2xl border border-slate-200 p-5">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-bold text-slate-800">{getNomeCelula(relatorio.celula_id)}</p>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    relatorio.realizou_celula ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {relatorio.realizou_celula ? 'Realizada' : 'Não realizada'}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  Líder: {getNomeUsuario(relatorio.lider_id)} •{' '}
                                  {new Date(relatorio.data_referencia).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} •{' '}
                                  Enviado: {new Date(relatorio.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                                {relatorio.realizou_celula && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Presentes: <span className="font-semibold">{relatorio.total_presentes ?? 0}</span> •
                                    Visitantes: <span className="font-semibold">{relatorio.visitantes ?? 0}</span> •
                                    Crianças: <span className="font-semibold">{relatorio.quantidade_criancas ?? 0}</span>
                                  </p>
                                )}
                              </div>
                              <button onClick={() => setRelatorioParaExcluir(relatorio)}
                                className="shrink-0 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600">
                                Excluir
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ABA: Excluir Células */}
                {abaAtiva === 'celulas' && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                      ⚠️ A exclusão de uma célula é <strong>irreversível</strong> e removerá todos os relatórios, presenças e membros vinculados. Uma confirmação extra será solicitada.
                    </div>
                    <input placeholder="Buscar por nome da célula ou líder..." value={buscaCelula}
                      onChange={(e) => setBuscaCelula(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50" />
                    <p className="text-sm text-slate-500">{celulasFiltradas.length} célula(s) encontrada(s)</p>
                    <div className="space-y-3">
                      {celulasFiltradas.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Nenhuma célula encontrada.</div>
                      ) : (
                        celulasFiltradas.map((celula) => {
                          const totalRels = relatorios.filter((r) => r.celula_id === celula.id).length
                          return (
                            <div key={celula.id} className="rounded-2xl border border-slate-200 p-5">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-bold text-slate-800">{celula.nome}</p>
                                    {celula.codigo && (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">#{celula.codigo}</span>
                                    )}
                                    {celula.tipo_celula && (
                                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{celula.tipo_celula}</span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Líder: {getNomeUsuario(celula.lider_id)}
                                    {celula.dia_semana ? ` • ${celula.dia_semana}` : ''}
                                    {celula.quantidade_pessoas ? ` • ${celula.quantidade_pessoas} pessoas` : ''}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-400">{totalRels} relatório(s) vinculado(s)</p>
                                </div>
                                <button onClick={() => { setCelulaParaExcluir(celula); setConfirmacaoNomeCelula('') }}
                                  className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                                  Excluir
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}