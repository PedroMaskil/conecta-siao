'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type PerfilUsuario = {
  id: string
  nome: string
  tipo: string
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

export default function LiderPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [celula, setCelula] = useState<Celula | null>(null)

  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [quantidadePessoas, setQuantidadePessoas] = useState('')
  const [tipoCelula, setTipoCelula] = useState('')
  const [diaSemana, setDiaSemana] = useState('')

  useEffect(() => {
    async function carregarPagina() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('id, nome, tipo')
        .eq('id', user.id)
        .single()

      if (!perfilData || perfilData.tipo !== 'lider') {
        router.push('/login')
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
        setQuantidadePessoas(
          celulaData.quantidade_pessoas?.toString() || ''
        )
        setTipoCelula(celulaData.tipo_celula || '')
        setDiaSemana(celulaData.dia_semana || '')
      }

      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  async function handleSalvarCelula() {
    if (!perfil) return

    if (!nome || !endereco || !quantidadePessoas || !tipoCelula || !diaSemana) {
      alert('Preencha todos os campos.')
      return
    }

    setSalvando(true)

    if (!celula) {
      const { data } = await supabase
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

      setCelula(data)
      alert('Célula criada!')
      setSalvando(false)
      return
    }

    const { data } = await supabase
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

    setCelula(data)
    alert('Célula atualizada!')
    setSalvando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Área do Líder
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Bem-vindo, <span className="font-semibold">{perfil?.nome}</span>
            </p>

            {celula && (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  Código: <span className="font-semibold">{celula.codigo}</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Última modificação:{' '}
                  <span className="font-semibold">
                    {new Date(celula.atualizado_em).toLocaleString('pt-BR', {
                       timeZone: 'America/Sao_Paulo',
                       dateStyle: 'short',
                       timeStyle: 'medium',
                    })}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/lider/relatorio')}
              className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
            >
              Enviar relatório
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
            >
              Sair
            </button>
          </div>
        </div>

        {/* FORM */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
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
                className="w-full mt-1 rounded-xl border px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Endereço
              </label>
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full mt-1 rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Pessoas
              </label>
              <input
                type="number"
                value={quantidadePessoas}
                onChange={(e) => setQuantidadePessoas(e.target.value)}
                className="w-full mt-1 rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Tipo
              </label>
              <select
                value={tipoCelula}
                onChange={(e) => setTipoCelula(e.target.value)}
                className="w-full mt-1 rounded-xl border px-4 py-3"
              >
                <option value="">Selecione</option>
                <option>Kids</option>
                <option>Casais</option>
                <option>Solteiros</option>
                <option>Solteiras</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Dia
              </label>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value)}
                className="w-full mt-1 rounded-xl border px-4 py-3"
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

          <div className="mt-6">
            <button
              onClick={handleSalvarCelula}
              disabled={salvando}
              className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700"
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
  )
}