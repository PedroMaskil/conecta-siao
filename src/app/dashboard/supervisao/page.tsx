'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Usuario = {
  id: string
  nome: string
  email: string
}

type Celula = {
  id: string
  nome: string
  lider_id: string | null
  supervisor_id: string | null
  tipo_celula: string | null
  dia_semana: string | null
  celula_kids_id: string | null
}

type ToastType = 'success' | 'error'

export default function CelulaKidsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [busca, setBusca] = useState('')

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
        .select('is_secretaria, is_super_admin')
        .eq('id', user.id)
        .single()

      if (!perfil || (!perfil.is_secretaria && !perfil.is_super_admin)) {
        router.push('/dashboard')
        return
      }

      await carregarDados()
      setLoading(false)
    }

    load()
  }, [router, supabase])

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
  }

  async function carregarDados() {
    const [{ data: usuariosData }, { data: celulasData }] = await Promise.all([
      supabase.from('usuarios').select('id, nome, email').order('nome', { ascending: true }),
      supabase.from('celulas').select('*').order('nome', { ascending: true }),
    ])

    setUsuarios(usuariosData || [])
    setCelulas(celulasData || [])
  }

  function getNomeUsuario(id: string | null) {
    if (!id) return 'Não definido'
    return usuarios.find((u) => u.id === id)?.nome || 'Não encontrado'
  }

  function getNomeCelula(id: string | null) {
    if (!id) return 'Sem vínculo'
    return celulas.find((c) => c.id === id)?.nome || 'Não encontrada'
  }

  const celulasPrincipais = useMemo(() => {
    const termo = busca.toLowerCase()
    return celulas
      .filter((c) => c.tipo_celula !== 'Kids')
      .filter((c) => {
        const lider = getNomeUsuario(c.lider_id).toLowerCase()
        return (
          c.nome.toLowerCase().includes(termo) ||
          lider.includes(termo) ||
          (c.tipo_celula || '').toLowerCase().includes(termo)
        )
      })
  }, [celulas, busca, usuarios])

  const celulasKids = useMemo(() => {
    return celulas.filter((c) => c.tipo_celula === 'Kids')
  }, [celulas])

  async function vincularCelulaKids(celulaId: string, kidsId: string) {
    const valorFinal = kidsId === '' ? null : kidsId

    if (valorFinal === celulaId) {
      showToast('Uma célula não pode ser vinculada a ela mesma.', 'error')
      return
    }

    const { error } = await supabase
      .from('celulas')
      .update({ celula_kids_id: valorFinal })
      .eq('id', celulaId)

    if (error) {
      showToast('Erro ao salvar vínculo da célula kids.', 'error')
      return
    }

    setCelulas((prev) =>
      prev.map((celula) =>
        celula.id === celulaId ? { ...celula, celula_kids_id: valorFinal } : celula
      )
    )

    showToast(
      valorFinal ? 'Célula kids vinculada com sucesso!' : 'Vínculo removido com sucesso!',
      'success'
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/30 blur-3xl" />
      </div>

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

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Célula Kids</h1>
                <p className="text-sm text-orange-50">
                  Vincule uma célula kids a uma célula principal
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/administracao')}
                className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
              >
                Voltar
              </button>
            </div>

            <div className="space-y-6 p-8">

              {/* Cards resumo */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Células principais</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {celulas.filter((c) => c.tipo_celula !== 'Kids').length}
                  </h2>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Células kids</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {celulasKids.length}
                  </h2>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Com vínculo kids</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {celulas.filter((c) => c.celula_kids_id).length}
                  </h2>
                </div>
              </div>

              {/* Lista */}
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Vincular célula kids</h2>
                    <p className="text-sm text-slate-500">
                      Escolha a célula principal e a célula kids correspondente
                    </p>
                  </div>
                  <input
                    placeholder="Buscar célula..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none md:max-w-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="space-y-4">
                  {celulasPrincipais.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                      Nenhuma célula principal encontrada.
                    </div>
                  ) : (
                    celulasPrincipais.map((celula) => (
                      <div key={celula.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr] xl:items-end">
                          <div>
                            <p className="text-sm text-slate-500">Célula principal</p>
                            <p className="font-semibold text-slate-800">{celula.nome}</p>
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

                          <div>
                            <p className="text-sm text-slate-500">Kids atual</p>
                            <p className="font-semibold text-slate-800">
                              {getNomeCelula(celula.celula_kids_id)}
                            </p>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Selecionar célula kids
                            </label>
                            <select
                              value={celula.celula_kids_id || ''}
                              onChange={(e) => vincularCelulaKids(celula.id, e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                            >
                              <option value="">Sem vínculo</option>
                              {celulasKids
                                .filter((kids) => kids.id !== celula.id)
                                .map((kids) => (
                                  <option key={kids.id} value={kids.id}>
                                    {kids.nome}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Aviso */}
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-900">
                Quando uma célula tiver uma célula kids vinculada, a tela de relatório
                poderá exibir a pergunta sobre célula kids e os dados relacionados.
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}