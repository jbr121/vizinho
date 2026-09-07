"use client"

import type { GeoPoint } from "@/domain/entities"
import type { ProviderListItem } from "@/application/queries"

export function NeighborhoodRadar({
  items,
  origin,
  originLabel,
}: {
  items: ProviderListItem[]
  origin: GeoPoint
  originLabel: string
}) {
  const scale = 140

  return (
    <div className="overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_center,oklch(0.93_0.03_155),oklch(0.88_0.04_145))] p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="font-medium text-foreground/80">Perto de {originLabel}</p>
        <p className="text-xs text-muted-foreground">raio aproximado de 8 km</p>
      </div>
      <svg viewBox="0 0 100 72" className="h-48 w-full sm:h-56" role="img" aria-label="Mapa de prestadores próximos">
        <circle cx="50" cy="36" r="28" fill="none" stroke="oklch(0.45 0.08 162 / 0.25)" />
        <circle cx="50" cy="36" r="18" fill="none" stroke="oklch(0.45 0.08 162 / 0.2)" />
        <circle cx="50" cy="36" r="8" fill="none" stroke="oklch(0.45 0.08 162 / 0.25)" />
        {items.slice(0, 9).map((item) => {
          const x = 50 + (item.provider.location.lng - origin.lng) * scale
          const y = 36 - (item.provider.location.lat - origin.lat) * scale
          const cx = Math.min(94, Math.max(6, x))
          const cy = Math.min(66, Math.max(6, y))
          return (
            <g key={item.user.id}>
              <circle cx={cx} cy={cy} r="2.4" fill={item.user.accent} />
              <text x={cx + 3.2} y={cy + 1.2} fontSize="3.2" fill="oklch(0.28 0.04 160)">
                {item.user.name.split(" ")[0]}
              </text>
            </g>
          )
        })}
        <circle cx="50" cy="36" r="3.2" fill="oklch(0.32 0.08 162)" />
        <text x="54" y="37.4" fontSize="3.4" fontWeight="600" fill="oklch(0.22 0.04 160)">
          Você
        </text>
      </svg>
    </div>
  )
}
