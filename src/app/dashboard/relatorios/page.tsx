'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function DashboardRelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [perfil, setPerfil] = useState<any>(null)
  const [celula, setCelula] = useState<any>(null)

  const [diaSemanaCelula, setDiaSemanaCelula] = useState('')
  const [realizouCelula, setRealizouCelula] = useState(true)
  const [totalPresentes, setTotalPresentes] = useState('')
  const [visitantes, setVisitantes] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [motivoNaoRealizacao, setMotivoNaoRealizacao] = useState('')

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
        .select('*')
        .eq('id', user.id)
        .single()

      if (!perfilData || !perfilData.is_lider) {
        router.push('/dashboard')
        return
      }

      setPerfil(perfilData)

      const { data: celulaData } = await supabase
        .from('celulas')
        .select('*')
        .eq('lider_id', user.id)
        .maybeSingle()

      if (!celulaData) {
        router.push('/dashboard/celula')
        return
      }

      setCelula(celulaData)
      setLoading(false)
    }

    carregarPagina()
  }, [])

  async function handleSalvarRelatorio() {
    if (!diaSemanaCelula) return alert('Escolha o dia.')

    if (realizouCelula && (totalPresentes === '' || visitantes === '')) {
      return alert('Preencha presentes.')
    }

    if (!realizouCelula && !motivoNaoRealizacao) {
      return alert('Informe o motivo.')
    }

    setSalvando(true)

    await supabase.from('relatorios').insert([
      {
        celula_id: celula.id,
        lider_id: perfil.id,
        data_referencia: new Date().toISOString(),
        dia_semana_celula: diaSemanaCelula,
        realizou_celula: realizouCelula,
        total_presentes: realizouCelula ? Number(totalPresentes) : 0,
        visitantes: realizouCelula ? Number(visitantes) : 0,
        observacoes: realizouCelula ? observacoes : null,
        motivo_nao_realizacao: realizouCelula ? null : motivoNaoRealizacao,
      },
    ])

    setSalvando(false)
    router.push('/dashboard')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-xl">

        {/* HEADER */}
        <div className="mb-6 rounded-2xl bg-blue-600 p-4 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">Relatório</h1>
          <p className="text-sm">{celula.nome}</p>
        </div>

        {/* DIA */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">Dia da célula</p>

          <div className="grid grid-cols-2 gap-2">
            {['Seg','Ter','Qua','Qui','Sex','Sab','Dom'].map((d) => (
              <button
                key={d}
                onClick={() => setDiaSemanaCelula(d)}
                className={`rounded-xl py-3 text-sm ${
                  diaSemanaCelula === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* REALIZOU */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setRealizouCelula(true)}
            className={`flex-1 rounded-xl py-3 ${
              realizouCelula ? 'bg-blue-600 text-white' : 'bg-white'
            }`}
          >
            Sim
          </button>

          <button
            onClick={() => setRealizouCelula(false)}
            className={`flex-1 rounded-xl py-3 ${
              !realizouCelula ? 'bg-red-500 text-white' : 'bg-white'
            }`}
          >
            Não
          </button>
        </div>

        {/* FORM */}
        {realizouCelula ? (
          <>
            <input
              type="number"
              placeholder="Presentes"
              value={totalPresentes}
              onChange={(e) => setTotalPresentes(e.target.value)}
              className="mb-3 w-full rounded-xl p-3"
            />

            <input
              type="number"
              placeholder="Visitantes"
              value={visitantes}
              onChange={(e) => setVisitantes(e.target.value)}
              className="mb-3 w-full rounded-xl p-3"
            />

            <textarea
              placeholder="Observações"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="mb-4 w-full rounded-xl p-3"
            />
          </>
        ) : (
          <textarea
            placeholder="Motivo"
            value={motivoNaoRealizacao}
            onChange={(e) => setMotivoNaoRealizacao(e.target.value)}
            className="mb-4 w-full rounded-xl p-3"
          />
        )}

        {/* BOTÃO */}
        <button
          onClick={handleSalvarRelatorio}
          disabled={salvando}
          className="w-full rounded-xl bg-blue-600 py-3 text-white"
        >
          {salvando ? 'Enviando...' : 'Enviar'}
        </button>

      </div>
    </div>
  )
}