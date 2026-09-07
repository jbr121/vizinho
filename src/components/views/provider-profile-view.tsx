"use client"

import Link from "next/link"
import { MapPin, ShieldCheck } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { StarRating } from "@/components/marketplace/star-rating"
import { VerificationBadge } from "@/components/marketplace/status-badges"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { useMarketplace } from "@/infrastructure/store"
import { getProviderView } from "@/application/queries"
import { formatDistance, formatMoney, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProviderProfileView({ providerId }: { providerId: string }) {
  const { state } = useMarketplace()
  const view = getProviderView(state, providerId)

  if (!view) {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Prestador não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          Esse perfil não existe ou foi removido da demonstração.
        </p>
        <Link href="/buscar" className={cn(buttonVariants(), "mt-4")}>
          Buscar profissionais
        </Link>
      </AppShell>
    )
  }

  const { provider, user, distanceKm, categories, reviews } = view

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="flex items-start gap-4">
            <div
              className="flex size-16 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{ background: user.accent }}
            >
              {user.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl">{user.name}</h1>
                <VerificationBadge status={provider.verificationStatus} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <StarRating value={provider.ratingAvg} />
                <span>
                  {provider.ratingAvg.toFixed(1)} · {provider.ratingCount} avaliações
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {provider.neighborhood} · {formatDistance(distanceKm)} de você
                </span>
              </div>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-muted-foreground">{provider.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>

          <h2 className="font-heading mt-8 text-lg">Avaliações</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Ainda não há comentários públicos neste perfil.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{review.from?.name ?? "Cliente"}</p>
                      <StarRating value={review.rating} />
                    </div>
                    <p className="mt-2 text-sm">{review.comment}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatRelative(review.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">A partir de</p>
          <p className="font-heading text-3xl">{formatMoney(provider.startingPriceCents)}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Raio de atendimento: {provider.radiusKm} km</li>
            <li>{provider.completedJobs} serviços concluídos</li>
            <li>{provider.yearsExperience} anos de experiência</li>
            <li className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              Documentos {provider.verificationStatus === "APPROVED" ? "aprovados" : "em análise"}
            </li>
          </ul>
          <Link
            href={`/solicitar?categoria=${provider.specialtyCategoryIds[0]}&prestador=${provider.userId}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}
          >
            Pedir orçamento
          </Link>
        </aside>
      </div>
    </AppShell>
  )
}
