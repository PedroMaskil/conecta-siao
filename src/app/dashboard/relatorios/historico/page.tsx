'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function HistoricoRelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState<any>(null)
  const [celula, setCelula] = useState<any>(null)
  const [relatorios, setRelatorios] = useState<any[]>([])
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('*')
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

      setCelula(celulaData)

      const { data } = await supabase
        .from('relatorios')
        .select('*')
        .eq('lider_id', user.id)
        .order('criado_em', { ascending: false })

      setRelatorios(data || [])
      setLoading(false)
    }

    load()
  }, [])

  const lista = useMemo(() => {
    if (filtro === 'realizadas') return relatorios.filter(r => r.realizou_celula)
    if (filtro === 'nao-realizadas') return relatorios.filter(r => !r.realizou_celula)
    return relatorios
  }, [relatorios, filtro])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-xl">

        {/* HEADER */}
        <div className="mb-6 rounded-2xl bg-blue-600 p-4 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">Histórico</h1>
          <p className="text-sm">{celula?.nome}</p>
        </div>

        {/* FILTRO */}
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mb-6 w-full rounded-xl p-3"
        >
          <option value="todos">Todos</option>
          <option value="realizadas">Realizadas</option>
          <option value="nao-realizadas">Não realizadas</option>
        </select>

        {/* LISTA */}
        <div className="space-y-4">
          {lista.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow">

              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">
                  {r.realizou_celula ? 'Realizada' : 'Não realizada'}
                </span>

                <span className="text-xs text-gray-500">
                  {new Date(r.criado_em).toLocaleDateString()}
                </span>
              </div>

              {r.realizou_celula ? (
                <>
                  <p className="text-sm">👥 {r.total_presentes} presentes</p>
                  <p className="text-sm">🙋 {r.visitantes} visitantes</p>

                  {r.observacoes && (
                    <p className="mt-2 text-sm text-gray-600">
                      {r.observacoes}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-red-500">
                  {r.motivo_nao_realizacao}
                </p>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}