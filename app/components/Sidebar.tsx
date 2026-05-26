'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: '📅 Agenda' },
  { href: '/dashboard/servicos', label: '✂️ Serviços' },
  { href: '/dashboard/horarios', label: '🕐 Horários' },
  { href: '/dashboard/relatorio', label: '📊 Relatório' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-56 bg-white/5 border-r border-white/10 p-5 flex flex-col justify-between min-h-screen sticky top-0">
      <div>
        <div className="mb-8">
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: '#7c3aed' }}>Agend</span>
            <span style={{ color: '#06b6d4' }}>Pro</span>
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`p-2 rounded-lg text-sm transition ${isActive ? 'bg-purple-900/40 text-white font-semibold' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}