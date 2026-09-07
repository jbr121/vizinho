"use client"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { RequestStatusBadge } from "@/components/marketplace/status-badges"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { useMarketplace } from "@/infrastructure/store"
import { getCurrentUser, requestsForUser } from "@/application/queries"
import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RequestsListView() {
  const { state } = useMarketplace()
  const user = getCurrentUser(state)
  const requests = requestsForUser(state)

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">
            {user.role === "PROVIDER" ? "Solicitações na sua especialidade" : "Pedidos"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "PROVIDER"
              ? "Responda com preço e prazo. O chat fica no pedido até acabar."
              : "Acompanhe propostas, converse e libere o pagamento só na conclusão."}
          </p>
        </div>
        {user.role === "CLIENT" ? (
          <Link href="/solicitar" className={cn(buttonVariants())}>
            Novo orçamento
          </Link>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8">
            <p className="font-medium">Nada por aqui</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.role === "CLIENT"
                ? "Publique um pedido com fotos para receber propostas de quem está perto."
                : "Quando um cliente da sua categoria pedir orçamento no raio, ele aparece nesta lista."}
            </p>
          </div>
        ) : (
          requests.map((request) => {
            const category = state.categories.find((item) => item.id === request.categoryId)
            const count = state.proposals.filter((item) => item.requestId === request.id).length
            return (
              <Link key={request.id} href={`/solicitacoes/${request.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {category?.name} · {count} proposta{count === 1 ? "" : "s"} ·{" "}
                        {formatRelative(request.createdAt)}
                      </p>
                    </div>
                    <RequestStatusBadge status={request.status} />
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </AppShell>
  )
}
