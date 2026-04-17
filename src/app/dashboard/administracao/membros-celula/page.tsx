'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'

const LeafletMap = dynamic(() => import('./mapa-celulas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      Carregando mapa...
    </div>
  ),
})

type PerfilUsuario = {
  id: string
  nome: string
  is_admin?: boolean | null
  is_secretaria?: boolean | null
}

type Celula = {
  id: string
  nome: string
  endereco: string | null
  latitude: number | null
  longitude: number | null
  lider_id: string | null
  supervisor_id: string | null
  tipo_celula: string | null
  dia_semana: string | null
  quantidade_pessoas: number | null
}

type Membro = {
  id: string
  nome: string
  celula_id: string
}

type Lider = {
  id: string
  nome: string
}

type Aba = 'mapa' | 'listagem'
type ToastType = 'success' | 'error'

export default function MembrosCelulasPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [carregandoMembros, setCarregandoMembros] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<Aba>('mapa')

  const [celulas, setCelulas] = useState<Celula[]>([])
  const [membrosPorCelula, setMembrosPorCelula] = useState<Record<string, Membro[]>>({})
  const [celulasExpandidas, setCelulasExpandidas] = useState<Record<string, boolean>>({})
  const [lideresMap, setLideresMap] = useState<Record<string, string>>({})

  const [busca, setBusca] = useState('')

  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    visible: boolean
  }>({
    message: '',
    type: 'success',
    visible: false,
  })

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3500)
  }

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
        .select('id, nome, is_admin, is_secretaria')
        .eq('id', user.id)
        .single()

      if (perfilError || !perfilData || (!perfilData.is_admin && !perfilData.is_secretaria)) {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      const { data: celulasData, error: celulasError } = await supabase
        .from('celulas')
        .select(
          'id, nome, endereco, latitude, longitude, lider_id, supervisor_id, tipo_celula, dia_semana, quantidade_pessoas'
        )
        .order('nome', { ascending: true })

      if (celulasError) {
        console.error('Erro ao carregar células:', celulasError)
        showToast('Erro ao carregar células.', 'error')
        setLoading(false)
        return
      }

      const listaCelulas = celulasData || []
      setCelulas(listaCelulas)

      const liderIds = Array.from(
        new Set(listaCelulas.map((c) => c.lider_id).filter(Boolean))
      ) as string[]

      if (liderIds.length > 0) {
        const { data: lideresData, error: lideresError } = await supabase
          .from('usuarios')
          .select('id, nome')
          .in('id', liderIds)

        if (!lideresError && lideresData) {
          const mapa: Record<string, string> = {}
          ;(lideresData as Lider[]).forEach((lider) => {
            mapa[lider.id] = lider.nome
          })
          setLideresMap(mapa)
        }
      }

      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  const celulasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return celulas

    return celulas.filter((celula) => {
      const nome = celula.nome?.toLowerCase() || ''
      const endereco = celula.endereco?.toLowerCase() || ''
      const tipo = celula.tipo_celula?.toLowerCase() || ''
      const lider = celula.lider_id ? (lideresMap[celula.lider_id] || '').toLowerCase() : ''

      return (
        nome.includes(termo) ||
        endereco.includes(termo) ||
        tipo.includes(termo) ||
        lider.includes(termo)
      )
    })
  }, [busca, celulas, lideresMap])

  const celulasComCoordenadas = useMemo(() => {
    return celulas.filter((c) => c.latitude !== null && c.longitude !== null)
  }, [celulas])

  function getNomeLider(liderId: string | null) {
    if (!liderId) return 'Sem líder'
    return lideresMap[liderId] || 'Líder não encontrado'
  }

  async function toggleExpandirCelula(celulaId: string) {
    const jaExpandida = !!celulasExpandidas[celulaId]

    if (jaExpandida) {
      setCelulasExpandidas((prev) => ({
        ...prev,
        [celulaId]: false,
      }))
      return
    }

    setCelulasExpandidas((prev) => ({
      ...prev,
      [celulaId]: true,
    }))

    if (membrosPorCelula[celulaId]) return

    setCarregandoMembros(celulaId)

    const { data, error } = await supabase
      .from('celula_membros')
      .select('id, nome, celula_id')
      .eq('celula_id', celulaId)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao carregar membros:', error)
      showToast('Erro ao carregar membros da célula.', 'error')
      setCarregandoMembros(null)
      return
    }

    setMembrosPorCelula((prev) => ({
      ...prev,
      [celulaId]: data || [],
    }))
    setCarregandoMembros(null)
  }

  async function handleExcluirCelula(celula: Celula) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a célula "${celula.nome}"?\n\nEssa ação não poderá ser desfeita.`
    )

    if (!confirmar) return

    setExcluindoId(celula.id)

    try {
      const { error: errorRelatorios } = await supabase
        .from('relatorios')
        .delete()
        .eq('celula_id', celula.id)

      if (errorRelatorios) {
        console.error(errorRelatorios)
      }

      const { error: errorMembros } = await supabase
        .from('celula_membros')
        .delete()
        .eq('celula_id', celula.id)

      if (errorMembros) {
        showToast('Erro ao excluir membros vinculados.', 'error')
        setExcluindoId(null)
        return
      }

      const { error: errorCelula } = await supabase
        .from('celulas')
        .delete()
        .eq('id', celula.id)

      if (errorCelula) {
        showToast('Erro ao excluir célula.', 'error')
        setExcluindoId(null)
        return
      }

      setCelulas((prev) => prev.filter((c) => c.id !== celula.id))

      setMembrosPorCelula((prev) => {
        const novo = { ...prev }
        delete novo[celula.id]
        return novo
      })

      setCelulasExpandidas((prev) => {
        const novo = { ...prev }
        delete novo[celula.id]
        return novo
      })

      showToast('Célula excluída com sucesso!', 'success')
    } catch (error) {
      console.error(error)
      showToast('Erro inesperado ao excluir célula.', 'error')
    }

    setExcluindoId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando administração...</p>
      </div>
    )
  }

  return (
    <>
      {toast.visible && (
        <div
          className={`fixed right-3 top-3 z-50 w-[calc(100vw-24px)] max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 sm:right-5 sm:top-5 sm:w-auto sm:min-w-[280px] ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-600 text-white'
              : 'border-red-200 bg-red-500 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                toast.type === 'success' ? 'bg-green-200' : 'bg-red-200'
              }`}
            />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 py-6 sm:px-4 sm:py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-green-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div
            className={`transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
                <div>
                  <h1 className="text-3xl font-bold">Membros e células</h1>
                  <p className="text-sm text-green-50">
                    Visualização geral das células, localizações e membros vinculados
                  </p>
                  <p className="mt-2 text-sm text-green-50">
                    Olá, <span className="font-semibold">{perfil?.nome}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/dashboard/administracao')}
                  className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30"
                >
                  Voltar
                </button>
              </div>

              <div className="space-y-6 p-4 sm:p-8">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('mapa')}
                    className={`rounded-2xl px-5 py-3 font-semibold transition ${
                      abaAtiva === 'mapa'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-white text-slate-700 shadow'
                    }`}
                  >
                    Mapa
                  </button>

                  <button
                    type="button"
                    onClick={() => setAbaAtiva('listagem')}
                    className={`rounded-2xl px-5 py-3 font-semibold transition ${
                      abaAtiva === 'listagem'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-white text-slate-700 shadow'
                    }`}
                  >
                    Listagem
                  </button>
                </div>

                {abaAtiva === 'mapa' ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
                    <div className="mb-5">
                      <h2 className="text-2xl font-bold text-slate-800">Mapa das células</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Veja a localização de todas as células cadastradas.
                      </p>
                    </div>

                    {celulasComCoordenadas.length === 0 ? (
                      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-slate-100 text-center text-slate-500">
                        Nenhuma célula com latitude e longitude cadastradas.
                      </div>
                    ) : (
                      <LeafletMap celulas={celulasComCoordenadas} lideresMap={lideresMap} />
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">Listagem de células</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Exclua células e visualize todos os membros vinculados.
                        </p>
                      </div>

                      <div className="w-full max-w-md">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Buscar célula
                        </label>
                        <input
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          placeholder="Buscar por nome, endereço, tipo ou líder..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {celulasFiltradas.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                          Nenhuma célula encontrada.
                        </div>
                      ) : (
                        celulasFiltradas.map((celula) => {
                          const expandida = !!celulasExpandidas[celula.id]
                          const membros = membrosPorCelula[celula.id] || []

                          return (
                            <div
                              key={celula.id}
                              className="rounded-2xl border border-slate-200 p-5 transition hover:shadow-md"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-bold text-slate-800">
                                      {celula.nome}
                                    </h3>
                                    {celula.tipo_celula && (
                                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        {celula.tipo_celula}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-sm text-slate-500">
                                    Líder:{' '}
                                    <span className="font-semibold text-slate-700">
                                      {getNomeLider(celula.lider_id)}
                                    </span>
                                  </p>

                                  <p className="text-sm text-slate-500">
                                    Endereço:{' '}
                                    <span className="font-semibold text-slate-700">
                                      {celula.endereco || 'Não informado'}
                                    </span>
                                  </p>

                                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                    <p>
                                      Dia:{' '}
                                      <span className="font-semibold text-slate-700">
                                        {celula.dia_semana || '-'}
                                      </span>
                                    </p>
                                    <p>
                                      Capacidade:{' '}
                                      <span className="font-semibold text-slate-700">
                                        {celula.quantidade_pessoas ?? 0}
                                      </span>
                                    </p>
                                    <p>
                                      Coordenadas:{' '}
                                      <span className="font-semibold text-slate-700">
                                        {celula.latitude && celula.longitude
                                          ? `${celula.latitude}, ${celula.longitude}`
                                          : 'Não cadastradas'}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandirCelula(celula.id)}
                                    className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                  >
                                    {expandida ? 'Ocultar membros' : 'Ver membros'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleExcluirCelula(celula)}
                                    disabled={excluindoId === celula.id}
                                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                                  >
                                    {excluindoId === celula.id ? 'Excluindo...' : 'Excluir célula'}
                                  </button>
                                </div>
                              </div>

                              {expandida && (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-base font-bold text-slate-800">
                                      Membros vinculados
                                    </h4>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                                      {membros.length} membro(s)
                                    </span>
                                  </div>

                                  {carregandoMembros === celula.id ? (
                                    <p className="text-sm text-slate-500">Carregando membros...</p>
                                  ) : membros.length === 0 ? (
                                    <div className="rounded-xl bg-white px-4 py-4 text-sm text-slate-500">
                                      Nenhum membro cadastrado nesta célula.
                                    </div>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                      {membros.map((membro) => (
                                        <div
                                          key={membro.id}
                                          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                                        >
                                          <p className="font-medium text-slate-800">{membro.nome}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
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