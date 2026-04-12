'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type PerfilUsuario = {
  id: string
  nome: string
  is_lider?: boolean | null
}

type Celula = {
  id: string
  codigo: number
  nome: string
  lider_id: string
  supervisor_id: string | null
  endereco: string | null
  quantidade_pessoas: number | null
  tipo_celula: string | null
  dia_semana: string | null
  criado_em: string
  atualizado_em: string
}

type Membro = {
  id?: string
  nome: string
}

type ToastType = 'success' | 'error'

export default function DashboardCelulaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celula, setCelula] = useState<Celula | null>(null)

  const [nome, setNome] = useState('')
  const [cep, setCep] = useState('')
  const [numero, setNumero] = useState('')
  const [endereco, setEndereco] = useState('')
  const [enderecoCompleto, setEnderecoCompleto] = useState('')
  const [quantidadePessoas, setQuantidadePessoas] = useState('')
  const [tipoCelula, setTipoCelula] = useState('')
  const [diaSemana, setDiaSemana] = useState('')

  const [membros, setMembros] = useState<Membro[]>([])
  const [novoMembro, setNovoMembro] = useState('')
  const [buscaMembro, setBuscaMembro] = useState('')
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)
  const [nomeEditando, setNomeEditando] = useState('')
  const [confirmandoRemocaoIndex, setConfirmandoRemocaoIndex] = useState<number | null>(null)

  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'success', visible: false,
  })

  // ── Helpers ──────────────────────────────────────────────────────────────

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3500)
  }

  function formatarCep(valor: string) {
    const n = valor.replace(/\D/g, '').slice(0, 8)
    return n.length <= 5 ? n : `${n.slice(0, 5)}-${n.slice(5)}`
  }

  function montarEnderecoCompleto(base: string, num: string) {
    if (!base) return ''
    if (!num.trim()) return base
    const partes = base.split(', ')
    partes[0] = `${partes[0]}, ${num.trim()}`
    return partes.join(', ')
  }

  function extrairNumero(e: string) {
    const p = e.split(', ')
    return p.length >= 2 && /^\d+[a-zA-Z]?$/.test(p[1].trim()) ? p[1].trim() : ''
  }

  function extrairBaseSemNumero(e: string) {
    const p = e.split(', ')
    if (p.length >= 2 && /^\d+[a-zA-Z]?$/.test(p[1].trim())) return [p[0], ...p.slice(2)].join(', ')
    return e
  }

  // ── Carregamento ─────────────────────────────────────────────────────────

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)

    async function carregarPagina() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfilData } = await supabase
        .from('usuarios').select('id, nome, is_lider').eq('id', user.id).single()
      if (!perfilData?.is_lider) { router.push('/dashboard'); return }
      setPerfil(perfilData)

      const { data: celulaData } = await supabase
        .from('celulas').select('*').eq('lider_id', user.id).maybeSingle()

      if (celulaData) {
        setCelula(celulaData)
        setNome(celulaData.nome || '')
        setQuantidadePessoas(celulaData.quantidade_pessoas?.toString() || '')
        setTipoCelula(celulaData.tipo_celula || '')
        setDiaSemana(celulaData.dia_semana || '')
        const endSalvo = celulaData.endereco || ''
        const cepMatch = endSalvo.match(/\b\d{5}-?\d{3}\b/)
        if (cepMatch) setCep(cepMatch[0])
        setNumero(extrairNumero(endSalvo))
        setEndereco(extrairBaseSemNumero(endSalvo))
        setEnderecoCompleto(endSalvo)
        const { data: membrosData } = await supabase
          .from('celula_membros').select('id, nome')
          .eq('celula_id', celulaData.id).order('criado_em', { ascending: true })
        setMembros(membrosData || [])
      }
      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  useEffect(() => {
    setEnderecoCompleto(montarEnderecoCompleto(endereco, numero))
  }, [numero, endereco])

  // ── CEP ──────────────────────────────────────────────────────────────────

  async function buscarCep() {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) { showToast('Digite um CEP válido.', 'error'); return }
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (data.erro) { showToast('CEP não encontrado.', 'error'); setBuscandoCep(false); return }
      const partes = [data.logradouro, data.bairro, data.localidade ? `${data.localidade} - ${data.uf}` : data.uf, formatarCep(cepLimpo)].filter(Boolean)
      const base = partes.join(', ')
      setEndereco(base)
      setCep(formatarCep(cepLimpo))
      setNumero('')
      setEnderecoCompleto(base)
      showToast('Endereço preenchido! Adicione o número.', 'success')
    } catch { showToast('Erro ao buscar CEP.', 'error') }
    setBuscandoCep(false)
  }

  // ── Membros ───────────────────────────────────────────────────────────────

  const membrosFiltrados = membros
    .map((m, i) => ({ ...m, originalIndex: i }))
    .filter((m) => m.nome.toLowerCase().includes(buscaMembro.toLowerCase()))

  function adicionarMembro() {
    const n = novoMembro.trim()
    if (!n) { showToast('Digite o nome do membro.', 'error'); return }
    if (membros.some((m) => m.nome.toLowerCase() === n.toLowerCase())) {
      showToast('Esse membro já está cadastrado.', 'error'); return
    }
    setMembros((prev) => [...prev, { nome: n }])
    setNovoMembro('')
  }

  function iniciarEdicao(index: number) {
    setEditandoIndex(index)
    setNomeEditando(membros[index].nome)
    setConfirmandoRemocaoIndex(null)
  }

  function salvarEdicao(index: number) {
    const n = nomeEditando.trim()
    if (!n) { showToast('O nome não pode ser vazio.', 'error'); return }
    if (membros.some((m, i) => i !== index && m.nome.toLowerCase() === n.toLowerCase())) {
      showToast('Já existe um membro com esse nome.', 'error'); return
    }
    setMembros((prev) => prev.map((m, i) => i === index ? { ...m, nome: n } : m))
    setEditandoIndex(null)
    setNomeEditando('')
  }

  function cancelarEdicao() { setEditandoIndex(null); setNomeEditando('') }

  function pedirConfirmacaoRemocao(index: number) {
    setConfirmandoRemocaoIndex(index)
    setEditandoIndex(null)
  }

  function confirmarRemocao(index: number) {
    setMembros((prev) => prev.filter((_, i) => i !== index))
    setConfirmandoRemocaoIndex(null)
  }

  function onDragStart(i: number) { dragIndex.current = i }
  function onDragEnter(i: number) { dragOverIndex.current = i }
  function onDragEnd() {
    const from = dragIndex.current
    const to = dragOverIndex.current
    if (from === null || to === null || from === to) { dragIndex.current = null; dragOverIndex.current = null; return }
    const lista = [...membros]
    const [movido] = lista.splice(from, 1)
    lista.splice(to, 0, movido)
    setMembros(lista)
    dragIndex.current = null
    dragOverIndex.current = null
  }

  // ── Salvar ────────────────────────────────────────────────────────────────

  async function salvarMembros(celulaId: string) {
    const validos = membros.map((m) => ({ nome: m.nome.trim() })).filter((m) => m.nome)
    const { error: delErr } = await supabase.from('celula_membros').delete().eq('celula_id', celulaId)
    if (delErr) throw new Error('Erro ao limpar membros antigos.')
    if (validos.length > 0) {
      const { error: insErr } = await supabase.from('celula_membros').insert(validos.map((m) => ({ celula_id: celulaId, nome: m.nome })))
      if (insErr) throw new Error('Erro ao salvar membros.')
    }
  }

  async function handleSalvarCelula() {
    if (!perfil) return
    if (!nome || !endereco || !quantidadePessoas || !tipoCelula || !diaSemana) {
      showToast('Preencha todos os campos.', 'error'); return
    }
    const qtd = Number(quantidadePessoas)
    if (qtd > 0 && membros.length !== qtd) {
      showToast(`Quantidade informada: ${qtd}, mas há ${membros.length} membro(s). Ajuste antes de salvar.`, 'error'); return
    }
    const endFinal = enderecoCompleto || endereco
    setSalvando(true)
    try {
      if (!celula) {
        const { data, error } = await supabase.from('celulas')
          .insert([{ nome, lider_id: perfil.id, endereco: endFinal, quantidade_pessoas: qtd, tipo_celula: tipoCelula, dia_semana: diaSemana }])
          .select().single()
        if (error || !data) { showToast('Erro ao criar célula.', 'error'); setSalvando(false); return }
        await salvarMembros(data.id)
        setCelula(data)
        showToast('Célula criada com sucesso!', 'success')
        setSalvando(false); return
      }
      const { data, error } = await supabase.from('celulas')
        .update({ nome, endereco: endFinal, quantidade_pessoas: qtd, tipo_celula: tipoCelula, dia_semana: diaSemana })
        .eq('id', celula.id).select().single()
      if (error || !data) { showToast('Erro ao atualizar célula.', 'error'); setSalvando(false); return }
      await salvarMembros(celula.id)
      setCelula(data)
      showToast('Célula atualizada com sucesso!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
    }
    setSalvando(false)
  }

  // ── Derivados ─────────────────────────────────────────────────────────────

  const qtdInformada = Number(quantidadePessoas) || 0
  const progresso = qtdInformada > 0 ? Math.min((membros.length / qtdInformada) * 100, 100) : 0
  const statusCor = qtdInformada === 0 ? 'bg-slate-300' : membros.length === qtdInformada ? 'bg-green-500' : membros.length > qtdInformada ? 'bg-red-500' : 'bg-amber-400'
  const statusTexto = qtdInformada === 0 ? 'text-slate-500' : membros.length === qtdInformada ? 'text-green-600' : membros.length > qtdInformada ? 'text-red-600' : 'text-amber-600'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 py-6 sm:px-4 sm:py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-green-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

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

      <div className="relative z-10 flex justify-center">
        <div className={`w-full max-w-5xl transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl sm:rounded-3xl">

            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-4 text-white sm:px-8 sm:py-6">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Minha célula</h1>
                <p className="text-xs text-green-50 sm:text-sm">Crie e edite as informações fixas da sua célula</p>
              </div>
              <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold transition hover:bg-white/30">
                Voltar
              </button>
            </div>

            <div className="space-y-5 p-4 sm:space-y-6 sm:p-8">

              {/* Info do usuário */}
              <div>
                <p className="text-sm text-slate-500">
                  Bem-vindo, <span className="font-semibold">{perfil?.nome}</span>
                </p>
                {celula && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <p>Código: <span className="font-semibold">{celula.codigo}</span></p>
                    <p>Atualizado: <span className="font-semibold">
                      {new Date(celula.atualizado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}
                    </span></p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 sm:p-6">
                <h2 className="mb-1 text-xl font-bold text-slate-800 sm:text-2xl">{celula ? 'Editar célula' : 'Criar célula'}</h2>
                <p className="mb-5 text-sm text-slate-500">{celula ? 'Atualize as informações da sua célula.' : 'Cadastre sua célula para começar.'}</p>

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Nome da célula</label>
                    <input value={nome} onChange={(e) => setNome(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100" />
                  </div>

                  {/* CEP + botão — ocupa linha inteira no mobile */}
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">CEP</label>
                    <div className="mt-1 flex gap-2">
                      <input value={cep} onChange={(e) => setCep(formatarCep(e.target.value))}
                        placeholder="00000-000" maxLength={9}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarCep() } }} />
                      <button type="button" onClick={buscarCep} disabled={buscandoCep}
                        className="shrink-0 rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                        {buscandoCep ? '...' : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  {/* Número */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">Número</label>
                    <input value={numero} onChange={(e) => setNumero(e.target.value)}
                      placeholder="Ex: 123" disabled={!endereco}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-50" />
                    {!endereco && <p className="mt-1 text-xs text-slate-400">Busque o CEP primeiro.</p>}
                  </div>

                  {/* Endereço somente leitura */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Endereço <span className="font-normal text-slate-400">(preenchido pelo CEP)</span>
                    </label>
                    <input value={enderecoCompleto} disabled
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none" />
                  </div>

                  {/* Quantidade */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">Qtd. de pessoas</label>
                    <input type="number" value={quantidadePessoas} onChange={(e) => setQuantidadePessoas(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100" />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">Tipo</label>
                    <select value={tipoCelula} onChange={(e) => setTipoCelula(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100">
                      <option value="">Selecione</option>
                      <option>Mista</option><option>Kids</option><option>Adolescentes</option>
                      <option>Par</option><option>Rapazes</option><option>Moças</option>
                    </select>
                  </div>

                  {/* Dia — botões em grade no mobile */}
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Dia da semana</label>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia) => (
                        <button key={dia} type="button" onClick={() => setDiaSemana(dia)}
                          className={`rounded-xl py-2.5 text-xs font-semibold transition sm:text-sm ${
                            diaSemana === dia ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}>
                          {dia.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                    {diaSemana && (
                      <p className="mt-2 text-xs text-slate-500">Selecionado: <span className="font-semibold">{diaSemana}</span></p>
                    )}
                  </div>
                </div>

                {/* ── Membros ── */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                  {/* Cabeçalho membros */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 sm:text-xl">Membros</h3>
                      <p className={`mt-0.5 text-xs font-medium sm:text-sm ${statusTexto}`}>
                        {membros.length}/{qtdInformada || '?'}
                        {qtdInformada > 0 && membros.length === qtdInformada && ' ✓ ok'}
                        {qtdInformada > 0 && membros.length > qtdInformada && ' — excede'}
                        {qtdInformada > 0 && membros.length < qtdInformada && ` — faltam ${qtdInformada - membros.length}`}
                      </p>
                    </div>

                    {membros.length > 3 && (
                      <input value={buscaMembro} onChange={(e) => setBuscaMembro(e.target.value)}
                        placeholder="Buscar..."
                        className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:w-44" />
                    )}
                  </div>

                  {/* Barra de progresso */}
                  {qtdInformada > 0 && (
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${statusCor}`} style={{ width: `${progresso}%` }} />
                    </div>
                  )}

                  {membros.length > 1 && !buscaMembro && (
                    <p className="mt-2 text-xs text-slate-400">☰ Arraste para reordenar</p>
                  )}

                  {/* Lista de membros */}
                  <div className="mt-3 space-y-2">
                    {membrosFiltrados.length === 0 ? (
                      <div className="rounded-xl bg-white px-4 py-4 text-sm text-slate-500">
                        {buscaMembro ? 'Nenhum membro encontrado.' : 'Nenhum membro adicionado ainda.'}
                      </div>
                    ) : (
                      membrosFiltrados.map(({ nome: nomeMembro, originalIndex }) => {
                        const confirmando = confirmandoRemocaoIndex === originalIndex
                        const editando = editandoIndex === originalIndex

                        return (
                          <div key={originalIndex}
                            draggable={!buscaMembro}
                            onDragStart={() => onDragStart(originalIndex)}
                            onDragEnter={() => onDragEnter(originalIndex)}
                            onDragEnd={onDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`rounded-xl border bg-white px-3 py-3 transition ${
                              !buscaMembro ? 'cursor-grab active:cursor-grabbing' : ''
                            } ${confirmando ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}
                          >
                            {editando ? (
                              <div className="flex flex-col gap-2">
                                <input autoFocus value={nomeEditando}
                                  onChange={(e) => setNomeEditando(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); salvarEdicao(originalIndex) }
                                    if (e.key === 'Escape') cancelarEdicao()
                                  }}
                                  className="w-full rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200" />
                                <div className="flex gap-2">
                                  <button onClick={() => salvarEdicao(originalIndex)}
                                    className="flex-1 rounded-lg bg-green-600 py-2 text-xs font-semibold text-white transition hover:bg-green-700 sm:flex-none sm:px-4">
                                    Salvar
                                  </button>
                                  <button onClick={cancelarEdicao}
                                    className="flex-1 rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 sm:flex-none sm:px-4">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : confirmando ? (
                              <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-red-700">
                                  Remover <span className="font-bold">{nomeMembro}</span>?
                                </p>
                                <div className="flex gap-2">
                                  <button onClick={() => confirmarRemocao(originalIndex)}
                                    className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white transition hover:bg-red-600 sm:flex-none sm:px-4">
                                    Confirmar
                                  </button>
                                  <button onClick={() => setConfirmandoRemocaoIndex(null)}
                                    className="flex-1 rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 sm:flex-none sm:px-4">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  {!buscaMembro && <span className="shrink-0 text-base text-slate-300 select-none">☰</span>}
                                  <div className="min-w-0">
                                    <p className="text-xs text-slate-400">#{originalIndex + 1}</p>
                                    <p className="truncate font-medium text-slate-800 text-sm">{nomeMembro}</p>
                                  </div>
                                </div>
                                {/* Botões compactos no mobile */}
                                <div className="flex shrink-0 gap-1.5">
                                  <button onClick={() => iniciarEdicao(originalIndex)}
                                    className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 sm:px-3 sm:py-2">
                                    Editar
                                  </button>
                                  <button onClick={() => pedirConfirmacaoRemocao(originalIndex)}
                                    className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 sm:px-3 sm:py-2">
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Adicionar membro */}
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Adicionar membro</label>
                    <div className="flex gap-2">
                      <input value={novoMembro} onChange={(e) => setNovoMembro(e.target.value)}
                        placeholder="Nome do membro"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarMembro() } }} />
                      <button type="button" onClick={adicionarMembro}
                        className="shrink-0 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700">
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Salvar */}
                <div className="mt-5">
                  <button onClick={handleSalvarCelula} disabled={salvando}
                    className="w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 py-4 text-base font-semibold text-white transition hover:from-green-700 hover:to-emerald-600 disabled:opacity-60">
                    {salvando ? 'Salvando...' : celula ? 'Atualizar célula' : 'Criar célula'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}