type CardProps = {
  title: string
  value: string | number
  className?: string
}

export default function Card({ title, value, className }: CardProps) {
  return (
    <div
      className={`p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg transition hover:scale-105 ${className || ''}`}
    >
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}