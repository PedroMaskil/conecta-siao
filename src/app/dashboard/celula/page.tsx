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

export default function DashboardCelulaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celula, setCelula] = useState<Celula | null>(null)

  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [quantidadePessoas, setQuantidadePessoas] = useState('')
  const [tipoCelula, setTipoCelula] = useState('')
  const [diaSemana, setDiaSemana] = useState('')
  const [membros, setMembros] = useState<Membro[]>([])

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

      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('id, nome, is_lider')
        .eq('id', user.id)
        .single()

      if (!perfilData?.is_lider) {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      const { data: celulaData } = await supabase
        .from('celulas')
        .select('*')
        .eq('lider_id', user.id)
        .maybeSingle()

      if (celulaData) {
        setCelula(celulaData)
        setNome(celulaData.nome || '')
        setEndereco(celulaData.endereco || '')
        setQuantidadePessoas(celulaData.quantidade_pessoas?.toString() || '')
        setTipoCelula(celulaData.tipo_celula || '')
        setDiaSemana(celulaData.dia_semana || '')

        const { data: membrosData } = await supabase
          .from('celula_membros')
          .select('id, nome')
          .eq('celula_id', celulaData.id)
          .order('criado_em', { ascending: true })

        setMembros(membrosData || [])
      }

      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  function adicionarMembro() {
    setMembros((prev) => [...prev, { nome: '' }])
  }

  function removerMembro(index: number) {
    setMembros((prev) => prev.filter((_, i) => i !== index))
  }

  function atualizarNomeMembro(index: number, valor: string) {
    setMembros((prev) =>
      prev.map((membro, i) =>
        i === index ? { ...membro, nome: valor } : membro
      )
    )
  }

  async function salvarMembros(celulaId: string) {
    const membrosValidos = membros
      .map((m) => ({ nome: m.nome.trim() }))
      .filter((m) => m.nome !== '')

    const { error: deleteError } = await supabase
      .from('celula_membros')
      .delete()
      .eq('celula_id', celulaId)

    if (deleteError) {
      throw new Error('Erro ao limpar membros antigos.')
    }

    if (membrosValidos.length > 0) {
      const payload = membrosValidos.map((membro) => ({
        celula_id: celulaId,
        nome: membro.nome,
      }))

      const { error: insertError } = await supabase
        .from('celula_membros')
        .insert(payload)

      if (insertError) {
        throw new Error('Erro ao salvar membros.')
      }
    }
  }

  async function handleSalvarCelula() {
    if (!perfil) return

    if (!nome || !endereco || !quantidadePessoas || !tipoCelula || !diaSemana) {
      alert('Preencha todos os campos.')
      return
    }

    setSalvando(true)

    try {
      if (!celula) {
        const { data, error } = await supabase
          .from('celulas')
          .insert([
            {
              nome,
              lider_id: perfil.id,
              endereco,
              quantidade_pessoas: Number(quantidadePessoas),
              tipo_celula: tipoCelula,
              dia_semana: diaSemana,
            },
          ])
          .select()
          .single()

        if (error || !data) {
          alert('Erro ao criar célula: ' + (error?.message || 'desconhecido'))
          setSalvando(false)
          return
        }

        await salvarMembros(data.id)
        setCelula(data)
        alert('Célula criada com sucesso.')
        setSalvando(false)
        return
      }

      const { data, error } = await supabase
        .from('celulas')
        .update({
          nome,
          endereco,
          quantidade_pessoas: Number(quantidadePessoas),
          tipo_celula: tipoCelula,
          dia_semana: diaSemana,
        })
        .eq('id', celula.id)
        .select()
        .single()

      if (error || !data) {
        alert('Erro ao atualizar célula: ' + (error?.message || 'desconhecido'))
        setSalvando(false)
        return
      }

      await salvarMembros(celula.id)
      setCelula(data)
      alert('Célula atualizada com sucesso.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar membros.')
    }

    setSalvando(false)
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
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-green-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-5xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-6 text-white">
              <div>
                <h1 className="text-3xl font-bold">Minha célula</h1>
                <p className="text-sm text-green-50">
                  Crie e edite as informações fixas da sua célula
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-xl bg-white/20 px-4 py-2 transition hover:bg-white/30"
              >
                Voltar
              </button>
            </div>

            <div className="space-y-6 p-8">
              <div>
                <p className="text-sm text-slate-500">
                  Bem-vindo, <span className="font-semibold">{perfil?.nome}</span>
                </p>

                {celula && (
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p>
                      Código: <span className="font-semibold">{celula.codigo}</span>
                    </p>
                    <p>
                      Última modificação:{' '}
                      <span className="font-semibold">
                        {new Date(celula.atualizado_em).toLocaleString('pt-BR', {
                          timeZone: 'America/Sao_Paulo',
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <h2 className="mb-2 text-2xl font-bold text-slate-800">
                  {celula ? 'Editar célula' : 'Criar célula'}
                </h2>

                <p className="mb-6 text-sm text-slate-500">
                  {celula
                    ? 'Atualize as informações da sua célula.'
                    : 'Cadastre sua célula para começar.'}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Nome da célula
                    </label>
                    <input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Endereço
                    </label>
                    <input
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Quantidade de pessoas
                    </label>
                    <input
                      type="number"
                      value={quantidadePessoas}
                      onChange={(e) => setQuantidadePessoas(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Tipo
                    </label>
                    <select
                      value={tipoCelula}
                      onChange={(e) => setTipoCelula(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    >
                      <option value="">Selecione</option>
                      <option>Mista</option>
                      <option>Kids</option>
                      <option>Casais</option>
                      <option>Solteiros</option>
                      <option>Solteiras</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Dia
                    </label>
                    <select
                      value={diaSemana}
                      onChange={(e) => setDiaSemana(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    >
                      <option value="">Selecione</option>
                      <option>Segunda</option>
                      <option>Terça</option>
                      <option>Quarta</option>
                      <option>Quinta</option>
                      <option>Sexta</option>
                      <option>Sábado</option>
                      <option>Domingo</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        Membros da célula
                      </h3>
                      <p className="text-sm text-slate-500">
                        Quantidade informada: {quantidadePessoas || '0'} • Membros cadastrados: {membros.filter((m) => m.nome.trim() !== '').length}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={adicionarMembro}
                      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Adicionar membro
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {membros.length === 0 ? (
                      <div className="rounded-xl bg-white px-4 py-4 text-sm text-slate-500">
                        Nenhum membro cadastrado ainda.
                      </div>
                    ) : (
                      membros.map((membro, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-2 rounded-xl bg-white p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Membro {index + 1}
                            </label>
                            <input
                              value={membro.nome}
                              onChange={(e) =>
                                atualizarNomeMembro(index, e.target.value)
                              }
                              placeholder="Digite o nome do membro"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removerMembro(index)}
                            className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                          >
                            Remover
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSalvarCelula}
                    disabled={salvando}
                    className="w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 py-3.5 font-semibold text-white transition hover:from-green-700 hover:to-emerald-600 disabled:opacity-60"
                  >
                    {salvando
                      ? 'Salvando...'
                      : celula
                      ? 'Atualizar célula'
                      : 'Criar célula'}
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