"use client"

import { toast } from "sonner"
import { AppShell } from "@/components/layout/app-shell"
import { PaymentBadge, RequestStatusBadge, VerificationBadge } from "@/components/marketplace/status-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMarketplace } from "@/infrastructure/store"
import { adminQueue, getCurrentUser } from "@/application/queries"
import { formatMoney, formatRelative } from "@/lib/format"

export function AdminView() {
  const { state, dispatch } = useMarketplace()
  const user = getCurrentUser(state)

  if (user.role !== "ADMIN") {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Moderação</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Acesse como Equipe Vizinho no menu do avatar para conferir documentos, disputas e
          valores retidos.
        </p>
      </AppShell>
    )
  }

  const queue = adminQueue(state)

  return (
    <AppShell>
      <h1 className="font-heading text-2xl">Moderação e financeiro</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Verificação documental, disputa de serviço e acompanhamento do escrow. Nesta demo o
        dinheiro não sai de verdade.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Documentos pendentes</p>
            <p className="font-heading mt-1 text-2xl">{queue.pendingDocuments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Disputas</p>
            <p className="font-heading mt-1 text-2xl">{queue.disputes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Retido em escrow</p>
            <p className="font-heading mt-1 text-2xl">
              {formatMoney(queue.heldPayments.reduce((sum, item) => sum + item.amountCents, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="font-heading mt-8 text-lg">Verificação de prestadores</h2>
      <div className="mt-3 flex flex-col gap-3">
        {queue.pendingDocuments.length === 0 && queue.unverifiedProviders.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum documento aguardando análise.
          </p>
        ) : (
          queue.pendingDocuments.map((document) => {
            const provider = state.users.find((item) => item.id === document.providerId)
            return (
              <Card key={document.id}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {provider?.name} · {document.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {document.fileName} · enviado {formatRelative(document.submittedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (dispatch({ type: "REVIEW_DOCUMENT", documentId: document.id, approve: true })) {
                          toast.success("Documento aprovado.")
                        }
                      }}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (dispatch({ type: "REVIEW_DOCUMENT", documentId: document.id, approve: false })) {
                          toast.message("Documento recusado.")
                        }
                      }}
                    >
                      Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <h2 className="font-heading mt-8 text-lg">Contas em análise</h2>
      <div className="mt-3 flex flex-col gap-3">
        {queue.unverifiedProviders.map((provider) => {
          const account = state.users.find((item) => item.id === provider.userId)
          return (
            <Card key={provider.userId}>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{account?.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.neighborhood}</p>
                </div>
                <VerificationBadge status={provider.verificationStatus} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <h2 className="font-heading mt-8 text-lg">Disputas</h2>
      <div className="mt-3 flex flex-col gap-3">
        {queue.disputes.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhuma disputa aberta. Se um cliente contestar um serviço em andamento, o valor
            permanece retido até a moderação decidir.
          </p>
        ) : (
          queue.disputes.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  {request.title}
                  <RequestStatusBadge status={request.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    dispatch({
                      type: "RESOLVE_DISPUTE",
                      requestId: request.id,
                      releaseToProvider: true,
                    })
                  }
                >
                  Liberar ao prestador
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    dispatch({
                      type: "RESOLVE_DISPUTE",
                      requestId: request.id,
                      releaseToProvider: false,
                    })
                  }
                >
                  Estornar ao cliente
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <h2 className="font-heading mt-8 text-lg">Escrow</h2>
      <div className="mt-3 flex flex-col gap-3">
        {queue.heldPayments.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum valor retido no momento.
          </p>
        ) : (
          queue.heldPayments.map((payment) => {
            const job = state.jobs.find((item) => item.id === payment.jobId)
            const request = state.requests.find((item) => item.id === job?.requestId)
            return (
              <Card key={payment.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{request?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(payment.amountCents)} · taxa {formatMoney(payment.platformFeeCents)}
                    </p>
                  </div>
                  <PaymentBadge status={payment.status} />
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </AppShell>
  )
}
