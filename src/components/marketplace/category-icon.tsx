import {
  Droplets,
  Leaf,
  Paintbrush,
  Snowflake,
  Sparkles,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import type { Category } from "@/domain/entities"

const icons: Record<string, LucideIcon> = {
  snowflake: Snowflake,
  zap: Zap,
  droplets: Droplets,
  sparkles: Sparkles,
  leaf: Leaf,
  truck: Truck,
  wrench: Wrench,
  paintbrush: Paintbrush,
}

export function CategoryIcon({
  category,
  className,
}: {
  category: Category
  className?: string
}) {
  const Icon = icons[category.icon] ?? Wrench
  return <Icon className={className} />
}
