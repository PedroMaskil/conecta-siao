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

export default function HistoricoRelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [filtro, setFiltro] = useState('todos')

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
        .select('id, nome, is_lider')
        .eq('id', user.id)
        .single()

      if (perfilError || !perfilData || perfilData.is_lider !== true) {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      const { data: celulasData, error: celulasError } = await supabase
        .from('celulas')
        .select('id, nome, lider_id')
        .eq('lider_id', user.id)
        .order('nome', { ascending: true })

      if (celulasError || !celulasData || celulasData.length === 0) {
        router.push('/dashboard/celula')
        return
      }

      setCelulas(celulasData)

      const { data: relatoriosData, error: relatoriosError } = await supabase
        .from('relatorios')
        .select(
          'id, celula_id, lider_id, data_referencia, dia_semana_celula, realizou_celula, total_presentes, visitantes, observacoes, motivo_nao_realizacao, criado_em'
        )
        .eq('lider_id', user.id)
        .order('criado_em', { ascending: false })

      if (relatoriosError) {
        console.error('Erro ao carregar relatórios:', relatoriosError)
        setRelatorios([])
        setLoading(false)
        return
      }

      setRelatorios(relatoriosData || [])
      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  const relatoriosFiltrados = useMemo(() => {
    if (filtro === 'realizadas') return relatorios.filter((r) => r.realizou_celula === true)
    if (filtro === 'nao-realizadas') return relatorios.filter((r) => r.realizou_celula === false)
    return relatorios
  }, [relatorios, filtro])

  function getNomeCelula(celulaId: string) {
    return celulas.find((c) => c.id === celulaId)?.nome || 'Não encontrada'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando histórico...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Relatórios enviados</h1>
                <p className="text-sm text-blue-50">Histórico dos relatórios das suas células</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/relatorios')}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Novo relatório
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Voltar
                </button>
              </div>
            </div>

            <div className="space-y-6 p-8">
              <div className="space-y-1 text-sm text-slate-500">
                <p>
                  Líder: <span className="font-semibold">{perfil?.nome}</span>
                </p>
                <p>
                  Células: <span className="font-semibold">{celulas.map((c) => c.nome).join(', ')}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Histórico</h2>
                    <p className="text-sm text-slate-500">Visualize os relatórios que você já enviou</p>
                  </div>
                  <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                      <div key={relatorio.id} className="rounded-2xl border border-slate-200 p-5">
                        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-bold text-slate-800">
                              {relatorio.realizou_celula ? 'Célula realizada' : 'Célula não realizada'}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Célula:{' '}
                              <span className="font-semibold text-slate-700">
                                {getNomeCelula(relatorio.celula_id)}
                              </span>
                            </p>
                            <p className="text-sm text-slate-500">
                              Enviado em{' '}
                              <span className="font-semibold">
                                {new Date(relatorio.criado_em).toLocaleString('pt-BR', {
                                  timeZone: 'America/Sao_Paulo',
                                  dateStyle: 'short',
                                  timeStyle: 'medium',
                                })}
                              </span>
                            </p>
                          </div>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                              relatorio.realizou_celula ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {relatorio.realizou_celula ? 'Realizada' : 'Não realizada'}
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                            <p className="font-semibold text-slate-800">{relatorio.dia_semana_celula || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Presentes</p>
                            <p className="font-semibold text-slate-800">{relatorio.total_presentes ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Visitantes</p>
                            <p className="font-semibold text-slate-800">{relatorio.visitantes ?? 0}</p>
                          </div>
                        </div>

                        {relatorio.realizou_celula ? (
                          <div className="mt-4">
                            <p className="text-sm text-slate-500">Observações</p>
                            <p className="mt-1 text-slate-800">{relatorio.observacoes || '-'}</p>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <p className="text-sm text-slate-500">Motivo da não realização</p>
                            <p className="mt-1 text-slate-800">{relatorio.motivo_nao_realizacao || '-'}</p>
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