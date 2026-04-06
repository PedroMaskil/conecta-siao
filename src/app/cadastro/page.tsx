'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type ToastType = 'success' | 'error'

export default function Cadastro() {
  const supabase = createClient()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    visible: boolean
  }>({
    message: '',
    type: 'success',
    visible: false,
  })

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type, visible: true })

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3000)
  }

  async function handleCadastro() {
    if (!nome || !idade || !telefone || !endereco || !email || !password) {
      showToast('Preencha todos os campos.', 'error')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        showToast('Este e-mail já está cadastrado.', 'error')
      } else {
        showToast('Erro ao cadastrar: ' + error.message, 'error')
      }
      setLoading(false)
      return
    }

    const user = data.user

    if (!user) {
      showToast('Erro ao criar usuário.', 'error')
      setLoading(false)
      return
    }

    const { error: errorDb } = await supabase.from('usuarios').insert([
      {
        id: user.id,
        nome,
        idade: Number(idade),
        telefone,
        email,
        endereco,
        is_lider: false,
        is_supervisor: false,
        is_secretaria: false,
        is_super_admin: false,
      },
    ])

    if (errorDb) {
      showToast('Erro ao salvar dados.', 'error')
      setLoading(false)
      return
    }

    showToast('Cadastro realizado com sucesso!', 'success')

    setTimeout(() => {
      router.push('/login')
    }, 1500)

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center px-4 py-10">
      
      {/* TOAST */}
      {toast.visible && (
        <div className={`fixed top-5 right-5 z-50 rounded-xl px-6 py-4 shadow-lg text-white font-medium transition
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Conecta Sião</h1>
          <p className="text-sm text-slate-500 mt-2">
            Crie sua conta para acessar o sistema
          </p>
        </div>

        <div className="space-y-4">
          <input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            type="number"
            placeholder="Idade"
            value={idade}
            onChange={(e) => setIdade(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            placeholder="Endereço completo"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <button
            onClick={handleCadastro}
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  )
}