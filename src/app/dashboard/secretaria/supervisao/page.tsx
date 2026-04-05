'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Usuario = {
  id: string
  nome: string
  email: string
  is_supervisor?: boolean | null
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
        supabase.from('usuarios').select('*'),
        supabase.from('celulas').select('*'),
      ])

      setUsuarios(usuariosData || [])
      setCelulas(celulasData || [])
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const supervisores = useMemo(() => {
    return usuarios.filter((u) => u.is_supervisor)
  }, [usuarios])

  const celulasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()

    return celulas.filter((c) => {
      const lider = usuarios.find((u) => u.id === c.lider_id)
      const supervisor = usuarios.find((u) => u.id === c.supervisor_id)

      return (
        c.nome.toLowerCase().includes(termo) ||
        (lider?.nome || '').toLowerCase().includes(termo) ||
        (supervisor?.nome || '').toLowerCase().includes(termo)
      )
    })
  }, [busca, celulas, usuarios])

  function getNomeUsuario(id: string | null) {
    if (!id) return '-'
    return usuarios.find((u) => u.id === id)?.nome || '-'
  }

  async function atualizarSupervisor(celulaId: string, supervisorId: string) {
    setSalvandoCelulaId(celulaId)

    const valor = supervisorId || null

    await supabase
      .from('celulas')
      .update({ supervisor_id: valor })
      .eq('id', celulaId)

    setCelulas((prev) =>
      prev.map((c) =>
        c.id === celulaId ? { ...c, supervisor_id: valor } : c
      )
    )

    setSalvandoCelulaId(null)
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
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-orange-500 p-4 text-white sm:p-6 md:flex-row md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Supervisão
            </h1>
            <p className="text-sm">Atribuir supervisores</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm"
            >
              Voltar
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

        {/* LISTA */}
        <div className="space-y-4">
          {celulasFiltradas.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow">
              
              <div className="mb-3">
                <h2 className="font-bold text-slate-800">{c.nome}</h2>
                <p className="text-sm text-slate-500">
                  Líder: {getNomeUsuario(c.lider_id)}
                </p>
              </div>

              <select
                value={c.supervisor_id || ''}
                onChange={(e) => atualizarSupervisor(c.id, e.target.value)}
                disabled={salvandoCelulaId === c.id}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Sem supervisor</option>
                {supervisores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}