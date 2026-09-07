import Link from "next/link"
import { MapPin, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/marketplace/star-rating"
import { formatDistance, formatMoney } from "@/lib/format"
import type { ProviderListItem } from "@/application/queries"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ProviderCard({ item }: { item: ProviderListItem }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: item.user.accent }}
        >
          {item.user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/prestadores/${item.user.id}`}
              className="font-heading text-base font-medium hover:underline"
            >
              {item.user.name}
            </Link>
            {item.provider.verificationStatus === "APPROVED" ? (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="size-3" />
                Verificado
              </Badge>
            ) : (
              <Badge variant="outline">Em verificação</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StarRating value={item.provider.ratingAvg} />
            <span>
              {item.provider.ratingAvg.toFixed(1)} · {item.provider.ratingCount} avaliações
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {item.provider.neighborhood} · {formatDistance(item.distanceKm)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {item.provider.bio}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.categories.map((category) => (
              <Badge key={category.id} variant="outline">
                {category.name}
              </Badge>
            ))}
            <span className="text-sm font-medium">
              a partir de {formatMoney(item.provider.startingPriceCents)}
            </span>
          </div>
        </div>
        <Link
          href={`/prestadores/${item.user.id}`}
          className={cn(buttonVariants({ size: "sm" }), "shrink-0 self-start")}
        >
          Ver perfil
        </Link>
      </CardContent>
    </Card>
  )
}
