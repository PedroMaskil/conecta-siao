'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type PerfilUsuario = {
  id: string
  nome: string
  is_supervisor?: boolean | null
}

type Usuario = {
  id: string
  nome: string
  email: string
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

type Relatorio = {
  id: string
  celula_id: string
  lider_id: string
  data_referencia: string
  dia_semana_celula: string | null
  realizou_celula: boolean | null
  total_presentes: number | null
  visitantes: number | null
  observacoes: string | null
  motivo_nao_realizacao: string | null
  criado_em: string
}

export default function SupervisaoDashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])

  const [busca, setBusca] = useState('')
  const [filtroRelatorio, setFiltroRelatorio] = useState('todos')

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)

    async function carregarPagina() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from('usuarios')
        .select('id, nome, is_supervisor')
        .eq('id', user.id)
        .single()

      if (perfilError || !perfilData || perfilData.is_supervisor !== true) {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      const [
        { data: usuariosData, error: usuariosError },
        { data: celulasData, error: celulasError },
      ] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, nome, email')
          .order('nome', { ascending: true }),

        supabase
          .from('celulas')
          .select(
            'id, codigo, nome, lider_id, supervisor_id, endereco, quantidade_pessoas, tipo_celula, dia_semana, atualizado_em'
          )
          .eq('supervisor_id', user.id)
          .order('nome', { ascending: true }),
      ])

      if (usuariosError || celulasError) {
        router.push('/dashboard')
        return
      }

      const listaCelulas = celulasData || []
      setUsuarios(usuariosData || [])
      setCelulas(listaCelulas)

      if (listaCelulas.length === 0) {
        setRelatorios([])
        setLoading(false)
        return
      }

      const idsCelulas = listaCelulas.map((celula) => celula.id)

      const { data: relatoriosData, error: relatoriosError } = await supabase
        .from('relatorios')
        .select(
          'id, celula_id, lider_id, data_referencia, dia_semana_celula, realizou_celula, total_presentes, visitantes, observacoes, motivo_nao_realizacao, criado_em'
        )
        .in('celula_id', idsCelulas)
        .order('criado_em', { ascending: false })

      if (relatoriosError) {
        setRelatorios([])
        setLoading(false)
        return
      }

      setRelatorios(relatoriosData || [])
      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  function getNomeUsuario(id: string | null) {
    if (!id) return 'Não definido'
    const usuario = usuarios.find((item) => item.id === id)
    return usuario ? usuario.nome : 'Não encontrado'
  }

  function getNomeCelula(id: string) {
    const celula = celulas.find((item) => item.id === id)
    return celula ? celula.nome : 'Célula não encontrada'
  }

  const celulasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()

    return celulas.filter((celula) => {
      const nomeLider = getNomeUsuario(celula.lider_id).toLowerCase()

      return (
        celula.nome.toLowerCase().includes(termo) ||
        nomeLider.includes(termo) ||
        (celula.tipo_celula || '').toLowerCase().includes(termo)
      )
    })
  }, [busca, celulas])

  const idsCelulasFiltradas = useMemo(
    () => celulasFiltradas.map((celula) => celula.id),
    [celulasFiltradas]
  )

  const relatoriosFiltrados = useMemo(() => {
    let lista = relatorios.filter((relatorio) =>
      idsCelulasFiltradas.includes(relatorio.celula_id)
    )

    if (filtroRelatorio === 'realizadas') {
      lista = lista.filter((relatorio) => relatorio.realizou_celula === true)
    }

    if (filtroRelatorio === 'nao-realizadas') {
      lista = lista.filter((relatorio) => relatorio.realizou_celula === false)
    }

    return lista
  }, [relatorios, idsCelulasFiltradas, filtroRelatorio])

  const totalCelulas = celulas.length
  const totalRelatorios = relatorios.length
  const totalNaoRealizadas = relatorios.filter(
    (relatorio) => relatorio.realizou_celula === false
  ).length

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        Carregando supervisão...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-slate-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-slate-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-7xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-900 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Supervisão</h1>
                <p className="text-sm text-slate-200">
                  Acompanhe células e relatórios sob sua responsabilidade
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Voltar
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Sair
                </button>
              </div>
            </div>

            <div className="space-y-6 p-8">
              <div className="space-y-1 text-sm text-slate-500">
                <p>
                  Supervisor: <span className="font-semibold">{perfil?.nome}</span>
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Células supervisionadas</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {totalCelulas}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Relatórios recebidos</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {totalRelatorios}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Não realizadas</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {totalNaoRealizadas}
                  </h2>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Células supervisionadas
                    </h2>
                    <p className="text-sm text-slate-500">
                      Pesquise por célula, líder ou tipo
                    </p>
                  </div>

                  <input
                    placeholder="Buscar..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none md:max-w-sm focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div className="grid gap-4">
                  {celulasFiltradas.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                      Nenhuma célula supervisionada encontrada.
                    </div>
                  ) : (
                    celulasFiltradas.map((celula) => (
                      <div
                        key={celula.id}
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-sm text-slate-500">Célula</p>
                            <p className="font-semibold text-slate-800">
                              {celula.nome}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Líder</p>
                            <p className="font-semibold text-slate-800">
                              {getNomeUsuario(celula.lider_id)}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Tipo</p>
                            <p className="font-semibold text-slate-800">
                              {celula.tipo_celula || '-'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Dia</p>
                            <p className="font-semibold text-slate-800">
                              {celula.dia_semana || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-slate-500">Endereço</p>
                            <p className="font-semibold text-slate-800">
                              {celula.endereco || '-'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Pessoas</p>
                            <p className="font-semibold text-slate-800">
                              {celula.quantidade_pessoas ?? 0}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-slate-500">
                          Última modificação:{' '}
                          <span className="font-semibold text-slate-700">
                            {celula.atualizado_em
                              ? new Date(celula.atualizado_em).toLocaleString('pt-BR', {
                                  timeZone: 'America/Sao_Paulo',
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '-'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Relatórios recebidos
                    </h2>
                    <p className="text-sm text-slate-500">
                      Visualize o histórico das células supervisionadas
                    </p>
                  </div>

                  <select
                    value={filtroRelatorio}
                    onChange={(e) => setFiltroRelatorio(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                  >
                    <option value="todos">Todos</option>
                    <option value="realizadas">Só realizadas</option>
                    <option value="nao-realizadas">Só não realizadas</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {relatoriosFiltrados.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                      Nenhum relatório encontrado.
                    </div>
                  ) : (
                    relatoriosFiltrados.map((relatorio) => (
                      <div
                        key={relatorio.id}
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-bold text-slate-800">
                              {getNomeCelula(relatorio.celula_id)}
                            </p>
                            <p className="text-sm text-slate-500">
                              Líder:{' '}
                              <span className="font-semibold">
                                {getNomeUsuario(relatorio.lider_id)}
                              </span>
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              relatorio.realizou_celula
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {relatorio.realizou_celula ? 'Realizada' : 'Não realizada'}
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                          <div>
                            <p className="text-sm text-slate-500">Data do relatório</p>
                            <p className="font-semibold text-slate-800">
                              {new Date(relatorio.data_referencia).toLocaleDateString('pt-BR', {
                                timeZone: 'America/Sao_Paulo',
                              })}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Dia da célula</p>
                            <p className="font-semibold text-slate-800">
                              {relatorio.dia_semana_celula || '-'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Presentes</p>
                            <p className="font-semibold text-slate-800">
                              {relatorio.total_presentes ?? 0}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Visitantes</p>
                            <p className="font-semibold text-slate-800">
                              {relatorio.visitantes ?? 0}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-slate-500">Enviado em</p>
                            <p className="font-semibold text-slate-800">
                              {new Date(relatorio.criado_em).toLocaleString('pt-BR', {
                                timeZone: 'America/Sao_Paulo',
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>

                        {relatorio.realizou_celula ? (
                          <div className="mt-4">
                            <p className="text-sm text-slate-500">Observações</p>
                            <p className="mt-1 text-slate-800">
                              {relatorio.observacoes || '-'}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <p className="text-sm text-slate-500">Motivo da não realização</p>
                            <p className="mt-1 text-slate-800">
                              {relatorio.motivo_nao_realizacao || '-'}
                            </p>
                          </div>
                        )}
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
  )
}