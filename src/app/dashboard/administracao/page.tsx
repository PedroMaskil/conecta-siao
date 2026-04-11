'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdministracaoHome() {
  const supabase = createClient()
  const router = useRouter()

  const [nome, setNome] = useState('')

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', user.id)
        .single()

      if (data) {
        setNome(data.nome)
      }
    }

    load()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      
      {/* HEADER */}
<div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-orange-500 px-8 py-7 text-white shadow-2xl">
  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
    <div>
      <h1 className="text-3xl font-bold">
        Gestão de Supervisores e Células
      </h1>
      <p className="text-sm text-slate-200">
        Controle completo de supervisão, vínculos e organização das células
      </p>
    </div>

    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => router.push('/dashboard')}
        className="rounded-xl bg-white/20 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/30"
      >
        Voltar
      </button>
    </div>
  </div>
</div>

      {/* CARDS */}
      <div className="mx-auto mt-6 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* USUÁRIOS */}
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-800">
            Usuários e permissões
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tornar líder e supervisor
          </p>

          <button
            onClick={() => router.push('/dashboard/administracao/usuarios')}
            className="mt-4 w-full rounded-xl bg-slate-500 py-3 text-white font-semibold hover:bg-slate-600"
          >
            Abrir usuários
          </button>
        </div>

        {/* SUPERVISÃO */}
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-800">
            Supervisão
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Atribuir supervisores às células
          </p>

          <button
            onClick={() => router.push('/dashboard/administracao/supervisao')}
            className="mt-4 w-full rounded-xl bg-slate-500 py-3 text-white font-semibold hover:bg-slate-600"
          >
            Atribuir supervisão
          </button>
        </div>

        {/* CÉLULA KIDS */}
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-800">
            Célula Kids
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Vincular células kids às principais
          </p>

          <button
            onClick={() => router.push('/dashboard/administracao/celula-kids')}
            className="mt-4 w-full rounded-xl bg-pink-600 py-3 text-white font-semibold hover:bg-pink-700"
            >
              Gerenciar Kids
          </button>
        </div>

        {/* RELATÓRIOS */}
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-800">
            Relatórios
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visualizar, excluir e analisar
          </p>

          <button
            onClick={() => router.push('/dashboard/administracao/relatorios')}
            className="mt-4 w-full rounded-xl bg-slate-500 py-3 text-white font-semibold hover:bg-slate-600"
          >
            Ver relatórios
          </button>
        </div>

        {/* MEMBROS */}
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-800">
            Membros e células
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visualização geral das células
          </p>

          <button
            onClick={() => router.push('/dashboard/administracao/membros')}
            className="mt-4 w-full rounded-xl bg-slate-500 py-3 text-white font-semibold hover:bg-slate-600"
          >
            Ver membros
          </button>
        </div>

      </div>
    </div>
  )
}