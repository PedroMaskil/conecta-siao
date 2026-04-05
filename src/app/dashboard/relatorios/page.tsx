'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type PerfilUsuario = {
  id: string
  nome: string
  tipo?: string | null
  is_lider?: boolean | null
}

type Celula = {
  id: string
  nome: string
  lider_id: string
}

export default function DashboardRelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celula, setCelula] = useState<Celula | null>(null)

  const [dataReferencia, setDataReferencia] = useState('')
  const [totalPresentes, setTotalPresentes] = useState('')
  const [visitantes, setVisitantes] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    async function carregarPagina() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('id, nome, tipo, is_lider')
        .eq('id', user.id)
        .single()

      const podeSerLider =
        perfilData?.is_lider === true || perfilData?.tipo === 'lider'

      if (!perfilData || !podeSerLider) {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      const { data: celulaData, error: celulaError } = await supabase
        .from('celulas')
        .select('id, nome, lider_id')
        .eq('lider_id', user.id)
        .maybeSingle()

      if (celulaError || !celulaData) {
        alert('Você precisa criar sua célula antes de enviar relatórios.')
        router.push('/dashboard/celula')
        return
      }

      setCelula(celulaData)
      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  async function handleSalvarRelatorio() {
    if (!perfil || !celula) {
      alert('Dados da célula não carregados.')
      return
    }

    if (!dataReferencia || totalPresentes === '' || visitantes === '') {
      alert('Preencha os campos obrigatórios.')
      return
    }

    setSalvando(true)

    const { error } = await supabase
      .from('relatorios')
      .insert([
        {
          celula_id: celula.id,
          lider_id: perfil.id,
          data_referencia: dataReferencia,
          total_presentes: Number(totalPresentes),
          visitantes: Number(visitantes),
          observacoes,
        },
      ])

    if (error) {
      alert('Erro ao salvar relatório: ' + error.message)
      setSalvando(false)
      return
    }

    alert('Relatório enviado com sucesso!')

    setDataReferencia('')
    setTotalPresentes('')
    setVisitantes('')
    setObservacoes('')
    setSalvando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-700 text-lg">Carregando relatórios...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Enviar relatório
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Líder: <span className="font-semibold">{perfil?.nome}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Célula: <span className="font-semibold">{celula?.nome}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
            >
              Voltar
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-2 text-2xl font-bold text-slate-800">
            Relatório semanal
          </h2>

          <p className="mb-6 text-sm text-slate-500">
            Preencha os dados da reunião da semana.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Célula
              </label>
              <input
                value={celula?.nome || ''}
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data de referência
              </label>
              <input
                type="date"
                value={dataReferencia}
                onChange={(e) => setDataReferencia(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Total de presentes
              </label>
              <input
                type="number"
                min="0"
                value={totalPresentes}
                onChange={(e) => setTotalPresentes(e.target.value)}
                placeholder="Ex: 12"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Visitantes
              </label>
              <input
                type="number"
                min="0"
                value={visitantes}
                onChange={(e) => setVisitantes(e.target.value)}
                placeholder="Ex: 2"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Escreva observações importantes..."
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSalvarRelatorio}
              disabled={salvando}
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? 'Enviando...' : 'Enviar relatório'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}