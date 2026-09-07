"use client"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { RequestStatusBadge, VerificationBadge } from "@/components/marketplace/status-badges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { useMarketplace } from "@/infrastructure/store"
import { getCurrentUser, requestsForUser } from "@/application/queries"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProviderDashboardView() {
  const { state } = useMarketplace()
  const user = getCurrentUser(state)
  const provider = state.providers.find((item) => item.userId === user.id)

  if (user.role !== "PROVIDER" || !provider) {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Painel do prestador</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Entre como Ricardo Alves ou Marina Costa no menu do avatar para ver a fila, o raio e o
          que está retido para repasse.
        </p>
      </AppShell>
    )
  }

  const inbox = requestsForUser(state)
  const myJobs = state.jobs.filter((job) => job.providerId === user.id)
  const held = state.payments.filter((payment) => {
    const job = state.jobs.find((item) => item.id === payment.jobId)
    return job?.providerId === user.id && payment.status === "HELD"
  })
  const released = state.payments.filter((payment) => {
    const job = state.jobs.find((item) => item.id === payment.jobId)
    return job?.providerId === user.id && payment.status === "RELEASED"
  })

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">Painel · {user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {provider.neighborhood} · raio de {provider.radiusKm} km · a partir de{" "}
            {formatMoney(provider.startingPriceCents)}
          </p>
        </div>
        <VerificationBadge status={provider.verificationStatus} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Serviços feitos" value={String(provider.completedJobs)} />
        <Stat
          label="Retido agora"
          value={formatMoney(held.reduce((sum, item) => sum + item.providerAmountCents, 0))}
        />
        <Stat
          label="Já recebido (demo)"
          value={formatMoney(released.reduce((sum, item) => sum + item.providerAmountCents, 0))}
        />
      </div>

      <h2 className="font-heading mt-8 text-lg">Pedidos para responder</h2>
      <div className="mt-3 flex flex-col gap-3">
        {inbox.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum pedido na sua especialidade neste momento.
          </p>
        ) : (
          inbox.map((request) => (
            <Link key={request.id} href={`/solicitacoes/${request.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-xs text-muted-foreground">{request.address}</p>
                  </div>
                  <RequestStatusBadge status={request.status} />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <h2 className="font-heading mt-8 text-lg">Serviços em curso</h2>
      <div className="mt-3 flex flex-col gap-3">
        {myJobs.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Quando um cliente aceitar sua proposta, o job aparece aqui com o valor retido.
          </p>
        ) : (
          myJobs.map((job) => {
            const request = state.requests.find((item) => item.id === job.requestId)
            return (
              <Card key={job.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    {request?.title}
                    <RequestStatusBadge status={request?.status ?? job.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/solicitacoes/${job.requestId}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Abrir chat
                  </Link>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading mt-1 text-2xl">{value}</p>
      </CardContent>
    </Card>
  )
}
