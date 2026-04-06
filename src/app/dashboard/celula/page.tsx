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

      if (error) {
        alert('Erro ao criar célula: ' + error.message)
        setSalvando(false)
        return
      }

      setCelula(data)
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

    if (error) {
      alert('Erro ao atualizar célula: ' + error.message)
      setSalvando(false)
      return
    }

    setCelula(data)
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 py-6 sm:px-4 sm:py-10">
      
      {/* BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-green-200/30 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl sm:h-72 sm:w-72" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div className={`w-full max-w-4xl transition-all duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}>

          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">

            {/* HEADER */}
            <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-4 text-white sm:px-8 sm:py-6">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  Minha célula
                </h1>
                <p className="text-xs sm:text-sm text-green-50">
                  Informações da célula
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-xl bg-white/20 px-3 py-2 text-sm"
              >
                Voltar
              </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-5 p-4 sm:p-6 md:p-8">

              <div className="text-sm text-slate-500">
                Bem-vindo, <span className="font-semibold">{perfil?.nome}</span>
              </div>

              {celula && (
                <div className="text-xs sm:text-sm text-slate-500">
                  Código: <b>{celula.codigo}</b>
                </div>
              )}

              {/* FORM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <input
                  placeholder="Nome da célula"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="col-span-1 sm:col-span-2 rounded-xl p-3 border"
                />

                <input
                  placeholder="Endereço"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="col-span-1 sm:col-span-2 rounded-xl p-3 border"
                />

                <input
                  type="number"
                  placeholder="Pessoas"
                  value={quantidadePessoas}
                  onChange={(e) => setQuantidadePessoas(e.target.value)}
                  className="rounded-xl p-3 border"
                />

                <select
                  value={tipoCelula}
                  onChange={(e) => setTipoCelula(e.target.value)}
                  className="rounded-xl p-3 border"
                >
                  <option value="">Tipo</option>
                  <option>Kids</option>
                  <option>Par</option>
                  <option>Adolescentes</option>
                  <option>Rapazes</option>
                  <option>Moças</option>
                  <option>Mista</option>
                </select>

                <select
                  value={diaSemana}
                  onChange={(e) => setDiaSemana(e.target.value)}
                  className="col-span-1 sm:col-span-2 rounded-xl p-3 border"
                >
                  <option value="">Dia</option>
                  <option>Segunda</option>
                  <option>Terça</option>
                  <option>Quarta</option>
                  <option>Quinta</option>
                  <option>Sexta</option>
                  <option>Sábado</option>
                  <option>Domingo</option>
                </select>

              </div>

              <button
                onClick={handleSalvarCelula}
                disabled={salvando}
                className="w-full rounded-xl bg-green-600 py-3 text-white"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}