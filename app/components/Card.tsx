type CardProps = {
  title: string
  value: string | number
  sub?: string
  highlight?: boolean
  className?: string
}

export default function Card({ title, value, sub, highlight, className }: CardProps) {
  return (
    <div className={`p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg transition hover:scale-105 ${className || ''}`}>
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-semibold" style={{ color: highlight ? '#06b6d4' : '#fff' }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}