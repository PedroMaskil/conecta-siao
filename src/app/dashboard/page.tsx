'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type PerfilUsuario = {
  id: string
  nome: string
  email: string
  is_lider?: boolean | null
  is_supervisor?: boolean | null
  is_secretaria?: boolean | null
  is_super_admin?: boolean | null
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)

  useEffect(() => {
    async function carregarDashboard() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, is_lider, is_supervisor, is_secretaria, is_super_admin')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        alert('Não foi possível carregar seu perfil.')
        router.push('/login')
        return
      }

      setPerfil(data)
      setLoading(false)
    }

    carregarDashboard()
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isLider = perfil?.is_lider === true
  const isSupervisor = perfil?.is_supervisor === true
  const isAdministracao = perfil?.is_secretaria === true
  const isGestaoUsuarios = perfil?.is_super_admin === true

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-700 text-base sm:text-lg">
          Carregando dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
              Dashboard
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Bem-vindo,{' '}
              <span className="font-semibold">{perfil?.nome}</span>
            </p>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 break-all">
              E-mail:{' '}
              <span className="font-semibold">{perfil?.email}</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Sair
          </button>
        </div>

        {/* PERMISSÕES */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-xl sm:p-6">
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-slate-800">
            Suas permissões
          </h2>

          <div className="flex flex-wrap gap-2">
            {isLider && (
              <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-green-700">
                Líder
              </span>
            )}

            {isSupervisor && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700">
                Supervisor
              </span>
            )}

            {isAdministracao && (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-amber-700">
                Administração
              </span>
            )}

            {isGestaoUsuarios && (
              <span className="rounded-full bg-purple-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-purple-700">
                Gestão de Usuários
              </span>
            )}
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">

          {isLider && (
            <>
              <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-xl sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  Minha célula
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-500">
                  Crie ou edite as informações da sua célula.
                </p>

                <div className="mt-auto pt-6">
                  <button
                    onClick={() => router.push('/dashboard/celula')}
                    className="w-full rounded-xl bg-green-600 py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-green-700"
                  >
                    Minha célula
                  </button>
                </div>
              </div>

              <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-xl sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  Enviar relatório
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-500">
                  Envie o relatório semanal da sua célula.
                </p>

                <div className="mt-auto pt-6">
                  <button
                    onClick={() => router.push('/dashboard/relatorios')}
                    className="w-full rounded-xl bg-blue-600 py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-blue-700"
                  >
                    Enviar relatório
                  </button>
                </div>
              </div>
            </>
          )}

          {isSupervisor && (
            <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-xl sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                Supervisão
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                Acompanhe relatórios e células.
              </p>

              <div className="mt-auto pt-6">
                <button
                  onClick={() => router.push('/dashboard/supervisao')}
                  className="w-full rounded-xl bg-slate-700 py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-slate-800"
                >
                  Abrir supervisão
                </button>
              </div>
            </div>
          )}

          {isAdministracao && (
            <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-xl sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                Administração
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                Usuários, células e supervisões.
              </p>

              <div className="mt-auto pt-6">
                <button
                  onClick={() => router.push('/dashboard/secretaria')}
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-amber-600"
                >
                  Abrir administração
                </button>
              </div>
            </div>
          )}

          {isGestaoUsuarios && (
            <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-xl sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                Gestão de Usuários
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                Controle de acessos avançados.
              </p>

              <div className="mt-auto pt-6">
                <button
                  onClick={() => router.push('/dashboard/admin')}
                  className="w-full rounded-xl bg-purple-600 py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-purple-700"
                >
                  Abrir gestão
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}