export default function Card({ title, value }) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg hover:scale-[1.02] transition">

      <p className="text-sm text-white/50">{title}</p>

      <h3 className="text-2xl font-bold mt-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        {value}
      </h3>

    </div>
  )
}