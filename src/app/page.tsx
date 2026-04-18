export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-100 text-slate-800">
      <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo-conecta-siao.png"
              alt="Conecta Sião"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#sobre"
              className="text-sm font-semibold text-slate-600 transition hover:text-orange-500"
            >
              Sobre
            </a>
            <a
              href="#modulos"
              className="text-sm font-semibold text-slate-600 transition hover:text-orange-500"
            >
              Módulos
            </a>
            <a
              href="#acesso"
              className="text-sm font-semibold text-slate-600 transition hover:text-orange-500"
            >
              Acesso
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_30%)]" />

        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-14 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-orange-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-orange-600 shadow-sm">
              Gestão de células e escalas em um só lugar
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Organize sua igreja com mais clareza, agilidade e cuidado.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              O <span className="font-semibold text-orange-600">Conecta Sião</span> reúne em uma só plataforma
              a gestão de <span className="font-semibold">células</span> e <span className="font-semibold">escalas</span>,
              facilitando o acompanhamento de líderes, membros, relatórios, equipes e ministérios.
            </p>

            <div id="acesso" className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                Entrar
              </a>
              <a
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-2xl border border-orange-200 bg-white px-8 py-4 text-base font-bold text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50"
              >
                Cadastrar
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-orange-100 bg-white/90 p-5 shadow-2xl shadow-orange-100">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-3xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                    👥
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Células</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Acompanhe líderes, supervisores, membros, presença, relatórios, célula kids e dados
                    da sua rede de cuidado e discipulado.
                  </p>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                    📅
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Escalas</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Organize equipes, ministérios, datas e funções de maneira simples, deixando o processo
                    mais claro para todos os envolvidos.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-slate-900 px-6 py-5 text-white shadow-lg">
                <p className="text-sm uppercase tracking-[0.25em] text-orange-300">Visão do sistema</p>
                <p className="mt-2 text-lg font-semibold leading-8 text-slate-100">
                  Um login único para acessar os módulos conforme a permissão de cada usuário.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
        <div className="rounded-[2rem] border border-orange-100 bg-white/90 p-8 shadow-xl shadow-orange-100">
          <div className="max-w-3xl">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-orange-500">Sobre a plataforma</span>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
              Uma base única para organizar pessoas, ministérios e acompanhamento pastoral.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Em vez de ter ferramentas separadas, o Conecta Sião centraliza o acesso da igreja em um só ambiente.
              Cada pessoa entra com o mesmo login e visualiza somente o que tem permissão para acessar.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-6">
              <h3 className="text-lg font-bold text-slate-900">Login único</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Um só acesso para entrar na plataforma e depois seguir para o módulo correto.
              </p>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-6">
              <h3 className="text-lg font-bold text-slate-900">Permissões separadas</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Líder, supervisor, administrador e outros perfis podem coexistir sem conflito.
              </p>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-6">
              <h3 className="text-lg font-bold text-slate-900">Crescimento futuro</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Estrutura pronta para adicionar novos módulos, dashboards e relatórios com facilidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="modulos" className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-orange-500">Módulo 01</span>
            <h2 className="mt-3 text-3xl font-black text-slate-900">Gestão de Células</h2>
            <ul className="mt-6 space-y-3 text-slate-600">
              <li>• Cadastro e organização das células</li>
              <li>• Vínculo de líderes e supervisores</li>
              <li>• Relatórios semanais e acompanhamento</li>
              <li>• Presença, visitantes e crianças</li>
              <li>• Visualização por mapa e administração</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-100">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-orange-500">Módulo 02</span>
            <h2 className="mt-3 text-3xl font-black text-slate-900">Gestão de Escalas</h2>
            <ul className="mt-6 space-y-3 text-slate-600">
              <li>• Organização de ministérios e equipes</li>
              <li>• Distribuição de funções por data</li>
              <li>• Visualização clara das escalas</li>
              <li>• Acompanhamento dos responsáveis</li>
              <li>• Estrutura pronta para crescer junto com a igreja</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 pb-16 lg:px-8 lg:pb-24">
        <div className="rounded-[2.5rem] bg-slate-900 px-8 py-10 text-center text-white shadow-2xl shadow-orange-100">
          <h2 className="text-3xl font-black sm:text-4xl">Comece a organizar sua rotina ministerial.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300">
            Entre na plataforma para acessar seus módulos disponíveis ou faça seu cadastro para iniciar a estruturação.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/login"
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-orange-500 px-8 py-4 text-base font-bold text-white transition hover:bg-orange-600"
            >
              Fazer login
            </a>
            <a
              href="/cadastro"
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-base font-bold text-white transition hover:bg-white/15"
            >
              Criar conta
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
