"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({
  value,
  size = "sm",
  onChange,
}: {
  value: number
  size?: "sm" | "md"
  onChange?: (value: number) => void
}) {
  const px = size === "md" ? "size-6" : "size-3.5"

  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value)
        const icon = (
          <Star
            key={star}
            className={cn(
              px,
              filled ? "fill-[#D39B2A] text-[#D39B2A]" : "text-border",
            )}
          />
        )
        if (!onChange) return icon
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-sm p-0.5 hover:scale-105"
            aria-label={`${star} estrelas`}
          >
            <Star
              className={cn(
                px,
                star <= value ? "fill-[#D39B2A] text-[#D39B2A]" : "text-border",
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
