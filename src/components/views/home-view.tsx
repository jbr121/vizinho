"use client"

import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AppShell } from "@/components/layout/app-shell"
import { CategoryIcon } from "@/components/marketplace/category-icon"
import { NeighborhoodRadar } from "@/components/marketplace/neighborhood-radar"
import { ProviderCard } from "@/components/marketplace/provider-card"
import { RequestStatusBadge } from "@/components/marketplace/status-badges"
import { useMarketplace } from "@/infrastructure/store"
import {
  getCurrentUser,
  getOrigin,
  listProvidersNearby,
  requestsForUser,
} from "@/application/queries"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"

export function HomeView() {
  const { state } = useMarketplace()
  const user = getCurrentUser(state)
  const origin = getOrigin(state)
  const neighborhood =
    state.neighborhoods.find((item) => item.id === state.activeNeighborhoodId)?.name ??
    "Pinheiros"
  const [query, setQuery] = useState("")
  const nearby = useMemo(
    () => listProvidersNearby(state, { query, maxKm: 12 }),
    [state, query],
  )
  const myRequests = requestsForUser(state).slice(0, 3)

  return (
    <AppShell>
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-medium text-primary">Serviços do bairro</p>
          <h1 className="font-heading mt-1 max-w-xl text-3xl leading-tight tracking-tight sm:text-4xl">
            O boca a boca do {neighborhood}, com reputação e pagamento retido.
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Peça orçamento com fotos, converse com profissionais verificados e só libere o
            repasse quando o serviço terminar.
          </p>
          <form
            className="mt-6 flex flex-col gap-2 sm:flex-row"
            action="/buscar"
          >
            <Input
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ar-condicionado, faxina, chaveiro…"
              className="h-10 flex-1"
            />
            <Link href={`/buscar${query ? `?q=${encodeURIComponent(query)}` : ""}`} className={cn(buttonVariants({ size: "lg" }), "h-10")}>
              Buscar no raio
            </Link>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/solicitar" className={cn(buttonVariants(), "gap-1")}>
              <Plus className="size-4" />
              Pedir orçamento
            </Link>
            <Link href="/solicitacoes" className={cn(buttonVariants({ variant: "outline" }))}>
              Meus pedidos
            </Link>
          </div>
        </div>
        <NeighborhoodRadar items={nearby} origin={origin} originLabel={neighborhood} />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-xl">Categorias</h2>
            <p className="text-sm text-muted-foreground">
              Filtre por tipo de serviço. A listagem usa a sua localização atual.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {state.categories.map((category) => (
            <Link key={category.id} href={`/categorias/${category.slug}`}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CategoryIcon category={category} className="size-4" />
                  </span>
                  <span>
                    <span className="block font-medium">{category.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl">Prestadores próximos</h2>
            <Link href="/buscar" className="inline-flex items-center gap-1 text-sm text-primary">
              Ver mapa de reputação
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {nearby.length === 0 ? (
            <EmptyBox
              title="Ninguém neste raio"
              body="Amplie a busca ou troque o bairro no topo para ver profissionais em outra região."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {nearby.slice(0, 4).map((item) => (
                <ProviderCard key={item.user.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <aside>
          <h2 className="font-heading mb-4 text-xl">
            {user.role === "CLIENT" ? "Seus pedidos" : "Fila recente"}
          </h2>
          {myRequests.length === 0 ? (
            <EmptyBox
              title="Nenhum pedido ainda"
              body="Publique um orçamento com fotos e descrição. Os profissionais do raio respondem em chat."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {myRequests.map((request) => (
                <Link key={request.id} href={`/solicitacoes/${request.id}`}>
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{request.title}</p>
                        <RequestStatusBadge status={request.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{request.address}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Origem da busca: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)} · {neighborhood}, São
            Paulo. Pagamento simulado em escrow (12% de taxa da plataforma).
          </p>
        </aside>
      </section>
    </AppShell>
  )
}

function EmptyBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-sm">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted-foreground">{body}</p>
    </div>
  )
}
