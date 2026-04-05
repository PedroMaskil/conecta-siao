'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl text-center">
        <h1 className="text-4xl font-bold text-slate-800">Conecta Sião</h1>
        <p className="mt-3 text-slate-500">
          Sistema de gestão de células
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push('/login')}
            className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Entrar
          </button>

          <button
            onClick={() => router.push('/cadastro')}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  )
}