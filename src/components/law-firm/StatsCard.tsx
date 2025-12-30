import { Info } from 'lucide-react'

interface StatsCardProps {
  title: string
  stats: Array<{
    label: string
    value: number | string
    highlight?: boolean
    prefix?: string
  }>
  onInfoClick?: () => void
}

export function StatsCard({ title, stats, onInfoClick }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {onInfoClick && (
          <button
            onClick={onInfoClick}
            className="text-gray-400 hover:text-gray-600"
          >
            <Info size={18} />
          </button>
        )}
      </div>

      <div className="flex items-baseline gap-6">
        {stats.map((stat, index) => (
          <div key={index}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${
              stat.highlight
                ? stat.value.toString().startsWith('+')
                  ? 'text-green-500'
                  : stat.value.toString().startsWith('-')
                    ? 'text-red-500'
                    : 'text-gray-900'
                : 'text-gray-900'
            }`}>
              {stat.prefix}{stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
