'use client'

import Logo from './Logo'

export default function Sidebar() {
  return (
    <div className="w-64 bg-white/5 border-r border-white/10 p-6">

      <div className="mb-10">
        <Logo width={150} height={50} />
      </div>

      <nav className="flex flex-col gap-2">

        {['Dashboard', 'Agendamentos', 'Clientes', 'Configurações'].map(
          (item) => (
            <button
              key={item}
              className="text-left p-2 rounded-lg hover:bg-white/10 transition"
            >
              {item}
            </button>
          )
        )}

      </nav>
    </div>
  )
}