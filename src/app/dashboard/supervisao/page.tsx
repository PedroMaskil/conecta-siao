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

      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('id, nome, is_supervisor')
        .eq('id', user.id)
        .single()

      if (!perfilData || perfilData.is_supervisor !== true) {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      const [{ data: usuariosData }, { data: celulasData }] = await Promise.all([
        supabase.from('usuarios').select('id, nome, email'),
        supabase
          .from('celulas')
          .select('*')
          .eq('supervisor_id', user.id),
      ])

      const listaCelulas = celulasData || []
      setUsuarios(usuariosData || [])
      setCelulas(listaCelulas)

      if (listaCelulas.length === 0) {
        setLoading(false)
        return
      }

      const ids = listaCelulas.map((c) => c.id)

      const { data: relatoriosData } = await supabase
        .from('relatorios')
        .select('*')
        .in('celula_id', ids)
        .order('criado_em', { ascending: false })

      setRelatorios(relatoriosData || [])
      setLoading(false)
    }

    carregarPagina()
  }, [router, supabase])

  function getNomeUsuario(id: string | null) {
    if (!id) return '-'
    return usuarios.find((u) => u.id === id)?.nome || '-'
  }

  function getNomeCelula(id: string) {
    return celulas.find((c) => c.id === id)?.nome || '-'
  }

  const celulasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return celulas.filter((c) =>
      c.nome.toLowerCase().includes(termo)
    )
  }, [busca, celulas])

  const relatoriosFiltrados = useMemo(() => {
    let lista = relatorios

    if (filtroRelatorio === 'realizadas') {
      lista = lista.filter((r) => r.realizou_celula)
    }

    if (filtroRelatorio === 'nao-realizadas') {
      lista = lista.filter((r) => !r.realizou_celula)
    }

    return lista
  }, [relatorios, filtroRelatorio])

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
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-slate-800 p-4 text-white sm:p-6 md:flex-row md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Supervisão
            </h1>
            <p className="text-sm text-slate-300">
              {perfil?.nome}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm"
            >
              Voltar
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {/* BUSCA */}
        <input
          placeholder="Buscar célula..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="mb-6 w-full rounded-xl border p-3"
        />

        {/* CELULAS */}
        <div className="space-y-4">
          {celulasFiltradas.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow">
              <h2 className="font-bold">{c.nome}</h2>
              <p className="text-sm text-gray-500">
                Líder: {getNomeUsuario(c.lider_id)}
              </p>
            </div>
          ))}
        </div>

        {/* RELATÓRIOS */}
        <div className="mt-8 space-y-4">
          {relatoriosFiltrados.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow">
              <p className="font-bold">
                {getNomeCelula(r.celula_id)}
              </p>

              <p className="text-sm">
                {r.realizou_celula ? 'Realizada' : 'Não realizada'}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}