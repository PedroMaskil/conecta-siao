'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LiderPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verificarAcesso() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!perfil || perfil.tipo !== 'secretaria') {
        router.push('/login')
        return
      }

      setLoading(false)
    }

    verificarAcesso()
  }, [router, supabase])

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
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Área do Líder</h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}