'use client'

import { useEffect, useState } from 'react'
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

export default function DashboardRelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celula, setCelula] = useState<Celula | null>(null)

  const [diaSemanaCelula, setDiaSemanaCelula] = useState('')
  const [realizouCelula, setRealizouCelula] = useState(true)
  const [totalPresentes, setTotalPresentes] = useState('')
  const [visitantes, setVisitantes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [motivoNaoRealizacao, setMotivoNaoRealizacao] = useState('')

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

      const { data: celulaData, error: celulaError } = await supabase
        .from('celulas')
        .select('id, nome, lider_id')
        .eq('lider_id', user.id)
        .maybeSingle()

      if (celulaError || !celulaData) {
        router.push('/dashboard/celula')
        return
      }

      setCelula(celulaData)
      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  async function handleSalvarRelatorio() {
    if (!perfil || !celula) return

    if (!diaSemanaCelula) {
      alert('Selecione o dia da semana da célula.')
      return
    }

    if (realizouCelula) {
      if (totalPresentes === '' || visitantes === '') {
        alert('Preencha presentes e visitantes.')
        return
      }
    } else {
      if (!motivoNaoRealizacao) {
        alert('Informe o motivo da não realização da célula.')
        return
      }
    }

    setSalvando(true)

    const payload = {
      celula_id: celula.id,
      lider_id: perfil.id,
      dia_semana_celula: diaSemanaCelula,
      realizou_celula: realizouCelula,
      total_presentes: realizouCelula ? Number(totalPresentes) : 0,
      visitantes: realizouCelula ? Number(visitantes) : 0,
      observacoes: realizouCelula ? observacoes : null,
      motivo_nao_realizacao: realizouCelula ? null : motivoNaoRealizacao,
    }

    const { error } = await supabase
      .from('relatorios')
      .insert([payload])

    if (error) {
      alert('Erro ao salvar relatório: ' + error.message)
      setSalvando(false)
      return
    }

    setDiaSemanaCelula('')
    setRealizouCelula(true)
    setTotalPresentes('')
    setVisitantes('')
    setObservacoes('')
    setMotivoNaoRealizacao('')
    setSalvando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        Carregando relatórios...
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
          className={`w-full max-w-5xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Enviar relatório</h1>
                <p className="text-sm text-blue-50">
                  Preencha o relatório semanal da sua célula
                </p>
              </div>

              <div className="flex gap-3">
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
                  Líder: <span className="font-semibold">{perfil?.nome}</span>
                </p>
                <p>
                  Célula: <span className="font-semibold">{celula?.nome}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <h2 className="mb-2 text-2xl font-bold text-slate-800">
                  Relatório semanal
                </h2>

                <p className="mb-6 text-sm text-slate-500">
                  Informe se a célula foi realizada nesta semana.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Célula
                    </label>
                    <input
                      value={celula?.nome || ''}
                      disabled
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-3 block text-sm font-medium text-slate-700">
                      Quando a célula aconteceu ou deveria ter acontecido?
                    </label>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => setDiaSemanaCelula(dia)}
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                            diaSemanaCelula === dia
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-3 block text-sm font-medium text-slate-700">
                      Realizou a célula esta semana?
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setRealizouCelula(true)}
                        className={`rounded-2xl px-5 py-3 font-semibold transition ${
                          realizouCelula
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Sim
                      </button>

                      <button
                        type="button"
                        onClick={() => setRealizouCelula(false)}
                        className={`rounded-2xl px-5 py-3 font-semibold transition ${
                          !realizouCelula
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {realizouCelula ? (
                    <>
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
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Motivo da não realização
                      </label>
                      <textarea
                        value={motivoNaoRealizacao}
                        onChange={(e) => setMotivoNaoRealizacao(e.target.value)}
                        placeholder="Explique por que a célula não foi realizada nesta semana..."
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSalvarRelatorio}
                    disabled={salvando}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 py-3.5 font-semibold text-white transition hover:from-blue-700 hover:to-sky-600 disabled:opacity-60"
                  >
                    {salvando ? 'Enviando...' : 'Enviar relatório'}
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