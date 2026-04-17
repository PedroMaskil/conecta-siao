'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdministracaoHome() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [nome, setNome] = useState('')

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

      const { data } = await supabase
        .from('usuarios')
        .select('nome, is_secretaria')
        .eq('id', user.id)
        .single()

      if (!data?.is_secretaria) {
        router.push('/dashboard')
        return
      }

      if (data) setNome(data.nome)
    }

    load()
  }, [router, supabase])

  const cards = [
    {
      titulo: 'Usuários e permissões',
      descricao: 'Tornar líder e supervisor',
      rota: '/dashboard/administracao/usuarios',
      cor: 'bg-slate-600 hover:bg-slate-700',
      label: 'Abrir usuários',
    },
    {
      titulo: 'Supervisão',
      descricao: 'Atribuir supervisores às células',
      rota: '/dashboard/administracao/supervisao',
      cor: 'bg-blue-600 hover:bg-blue-700',
      label: 'Atribuir supervisão',
    },
    {
      titulo: 'Célula Kids',
      descricao: 'Vincular células kids às principais',
      rota: '/dashboard/administracao/celula-kids',
      cor: 'bg-pink-600 hover:bg-pink-700',
      label: 'Gerenciar Kids',
    },
    {
      titulo: 'Relatórios',
      descricao: 'Visualizar, excluir e analisar',
      rota: '/dashboard/administracao/relatorios',
      cor: 'bg-purple-600 hover:bg-purple-700',
      label: 'Ver relatórios',
    },
    {
      titulo: 'Membros e células',
      descricao: 'Visualização geral das células',
      rota: '/dashboard/administracao/membros-celula',
      cor: 'bg-green-600 hover:bg-green-700',
      label: 'Ver membros',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          {/* Header */}
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-7 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Administração</h1>
                <p className="mt-1 text-sm text-orange-100">
                  Controle completo de supervisão, vínculos e organização das células
                </p>
                {nome && (
                  <p className="mt-2 text-sm text-orange-100">
                    Olá, <span className="font-semibold text-white">{nome}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-fit rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30"
              >
                Voltar
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.rota}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur-xl transition hover:shadow-2xl"
              >
                <h2 className="text-lg font-bold text-slate-800">{card.titulo}</h2>
                <p className="mt-1 text-sm text-slate-500">{card.descricao}</p>

                <div className="mt-auto pt-6">
                  <button
                    onClick={() => router.push(card.rota)}
                    className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition ${card.cor}`}
                  >
                    {card.label}
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