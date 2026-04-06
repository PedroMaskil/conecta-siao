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

export default function SupervisaoPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvandoCelulaId, setSalvandoCelulaId] = useState<string | null>(null)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [busca, setBusca] = useState('')

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
          .select('id, codigo, nome, lider_id, supervisor_id, endereco, quantidade_pessoas, tipo_celula, dia_semana, atualizado_em')
          .order('nome', { ascending: true }),
      ])

      setUsuarios(usuariosData || [])
      setCelulas(celulasData || [])
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const supervisores = useMemo(() => {
    return usuarios.filter((usuario) => usuario.is_supervisor === true)
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

  function getNomeUsuario(id: string | null) {
    if (!id) return 'Não definido'
    const usuario = usuarios.find((item) => item.id === id)
    return usuario ? usuario.nome : 'Não encontrado'
  }

  async function atualizarSupervisorDaCelula(celulaId: string, supervisorId: string) {
    setSalvandoCelulaId(celulaId)

    const valorFinal = supervisorId === '' ? null : supervisorId

    const { error } = await supabase
      .from('celulas')
      .update({ supervisor_id: valorFinal })
      .eq('id', celulaId)

    if (error) {
      alert('Erro ao atualizar supervisor da célula.')
      setSalvandoCelulaId(null)
      return
    }

    setCelulas((atuais) =>
      atuais.map((celula) =>
        celula.id === celulaId
          ? { ...celula, supervisor_id: valorFinal }
          : celula
      )
    )

    setSalvandoCelulaId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        Carregando...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-7xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Atribuir supervisão</h1>
                <p className="text-sm text-orange-50">
                  Defina qual supervisor acompanha cada célula
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard/secretaria')}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Voltar
                </button>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
                >
                  Dashboard
                </button>
              </div>
            </div>

            <div className="space-y-6 p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Total de células</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {totalCelulas}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Supervisores ativos</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {totalSupervisores}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Células sem supervisor</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-800">
                    {celulasSemSupervisor}
                  </h2>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Células
                    </h2>
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

                        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Supervisor responsável
                            </label>

                            <select
                              value={celula.supervisor_id || ''}
                              onChange={(e) =>
                                atualizarSupervisorDaCelula(celula.id, e.target.value)
                              }
                              disabled={salvandoCelulaId === celula.id}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
                            >
                              <option value="">Sem supervisor</option>
                              {supervisores.map((supervisor) => (
                                <option key={supervisor.id} value={supervisor.id}>
                                  {supervisor.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            Atualizado:{' '}
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

                        <div className="mt-3 text-sm text-slate-500">
                          Supervisor atual:{' '}
                          <span className="font-semibold text-slate-700">
                            {getNomeUsuario(celula.supervisor_id)}
                          </span>
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
  )
}