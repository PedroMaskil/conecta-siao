'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdministracaoPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [celulas, setCelulas] = useState<any[]>([])
  const [relatorios, setRelatorios] = useState<any[]>([])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    async function load() {
      const { data: users } = await supabase.from('usuarios').select('*')
      const { data: cells } = await supabase.from('celulas').select('*')
      const { data: reports } = await supabase.from('relatorios').select('*')

      setUsuarios(users || [])
      setCelulas(cells || [])
      setRelatorios(reports || [])
      setLoading(false)
    }

    load()
  }, [])

  const usuariosFiltrados = useMemo(() => {
    return usuarios
      .filter((u) =>
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase())
      )
      .filter((u) => {
        if (filtro === 'lider') return u.is_lider
        if (filtro === 'supervisor') return u.is_supervisor
        return true
      })
  }, [usuarios, busca, filtro])

  async function togglePermissao(id: string, campo: string, valor: boolean) {
    await supabase.from('usuarios').update({ [campo]: valor }).eq('id', id)

    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [campo]: valor } : u))
    )
  }

  const totalLideres = usuarios.filter((u) => u.is_lider).length
  const totalSupervisores = usuarios.filter((u) => u.is_supervisor).length
  const celulasSemSupervisor = celulas.filter((c) => !c.supervisor_id).length

  if (loading) return <div className="p-10">Carregando...</div>

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administração</h1>
            <p className="text-slate-500 text-sm">
              Controle total do sistema
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl"
          >
            Voltar
          </button>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow">
            <p className="text-sm text-slate-500">Líderes</p>
            <h2 className="text-2xl font-bold">{totalLideres}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <p className="text-sm text-slate-500">Supervisores</p>
            <h2 className="text-2xl font-bold">{totalSupervisores}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <p className="text-sm text-slate-500">Sem Supervisor</p>
            <h2 className="text-2xl font-bold">{celulasSemSupervisor}</h2>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-5 rounded-2xl shadow flex flex-col md:flex-row gap-4">
          <input
            placeholder="Buscar usuário..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border p-3 rounded-xl w-full"
          />

          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border p-3 rounded-xl"
          >
            <option value="todos">Todos</option>
            <option value="lider">Líderes</option>
            <option value="supervisor">Supervisores</option>
          </select>
        </div>

        {/* USUÁRIOS */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">Gestão de Usuários</h2>

          <div className="space-y-3">
            {usuariosFiltrados.map((user) => (
              <div
                key={user.id}
                className="border p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{user.nome}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      togglePermissao(
                        user.id,
                        'is_lider',
                        !user.is_lider
                      )
                    }
                    className={`px-3 py-2 rounded-xl text-white ${
                      user.is_lider ? 'bg-red-500' : 'bg-green-600'
                    }`}
                  >
                    {user.is_lider ? 'Remover Líder' : 'Tornar Líder'}
                  </button>

                  <button
                    onClick={() =>
                      togglePermissao(
                        user.id,
                        'is_supervisor',
                        !user.is_supervisor
                      )
                    }
                    className={`px-3 py-2 rounded-xl text-white ${
                      user.is_supervisor ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                  >
                    {user.is_supervisor
                      ? 'Remover Supervisor'
                      : 'Tornar Supervisor'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}