"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { AppShell } from "@/components/layout/app-shell"
import { ChatThread } from "@/components/marketplace/chat-thread"
import { StarRating } from "@/components/marketplace/star-rating"
import {
  PaymentBadge,
  RequestStatusBadge,
  VerificationBadge,
} from "@/components/marketplace/status-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { buttonVariants } from "@/components/ui/button"
import { useMarketplace } from "@/infrastructure/store"
import { getCurrentUser, getRequestView } from "@/application/queries"
import { formatDateTime, formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RequestDetailView({ requestId }: { requestId: string }) {
  const { state, dispatch } = useMarketplace()
  const user = getCurrentUser(state)
  const view = getRequestView(state, requestId)
  const [amount, setAmount] = useState("250")
  const [eta, setEta] = useState("3")
  const [proposalMessage, setProposalMessage] = useState("")

  if (!view) {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Pedido não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esse orçamento não existe mais nesta sessão da demonstração.
        </p>
        <Link href="/solicitacoes" className={cn(buttonVariants(), "mt-4")}>
          Voltar aos pedidos
        </Link>
      </AppShell>
    )
  }

  const { request, category, client, proposals, job, payment, messages, reviews } = view
  const myProposal = proposals.find((item) => item.providerId === user.id)
  const myReview = reviews.find((item) => item.fromUserId === user.id)
  const canPropose =
    user.role === "PROVIDER" &&
    !myProposal &&
    (request.status === "OPEN" || request.status === "PROPOSALS_RECEIVED")
  const canAccept = user.role === "CLIENT" && user.id === request.clientId
  const waitingConfirm = Boolean(job?.completedAt && job.status !== "COMPLETED")

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{category?.name}</p>
          <h1 className="font-heading text-2xl">{request.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client?.name} · {request.address} ·{" "}
            {request.scheduleType === "IMMEDIATE" ? "Imediato" : formatDateTime(request.scheduledAt)}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      <p className="mt-4 max-w-2xl text-sm">{request.description}</p>
      {request.attachments.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Anexos: {request.attachments.join(", ")}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ChatThread
          messages={messages}
          currentUserId={user.id}
          onSend={(body) => dispatch({ type: "SEND_MESSAGE", requestId: request.id, body })}
        />

        <div className="flex flex-col gap-4">
          {payment && job ? (
            <Card>
              <CardHeader>
                <CardTitle>Pagamento em garantia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>{formatMoney(payment.amountCents)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa Vizinho (12%)</span>
                  <span>{formatMoney(payment.platformFeeCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repasse</span>
                  <span>{formatMoney(payment.providerAmountCents)}</span>
                </div>
                <PaymentBadge status={payment.status} />
              </CardContent>
            </Card>
          ) : null}

          {job && user.id === job.providerId && job.status === "SCHEDULED" ? (
            <Button
              onClick={() => {
                if (dispatch({ type: "START_JOB", jobId: job.id })) {
                  toast.success("Atendimento iniciado.")
                }
              }}
            >
              Sair para o atendimento
            </Button>
          ) : null}

          {job && user.id === job.providerId && job.status === "IN_PROGRESS" && !job.completedAt ? (
            <Button
              onClick={() => {
                if (dispatch({ type: "COMPLETE_JOB", jobId: job.id })) {
                  toast.success("Aguardando confirmação do cliente.")
                }
              }}
            >
              Marcar como concluído
            </Button>
          ) : null}

          {job && canAccept && waitingConfirm ? (
            <Button
              onClick={() => {
                if (dispatch({ type: "CONFIRM_COMPLETION", jobId: job.id })) {
                  toast.success("Repasse liberado ao prestador.")
                }
              }}
            >
              Confirmar e liberar pagamento
            </Button>
          ) : null}

          {job && canAccept && job.status === "IN_PROGRESS" ? (
            <Button
              variant="outline"
              onClick={() => {
                if (dispatch({ type: "OPEN_DISPUTE", requestId: request.id })) {
                  toast.message("Disputa aberta. A moderação decide o repasse.")
                }
              }}
            >
              Abrir disputa
            </Button>
          ) : null}

          {job?.status === "COMPLETED" && !myReview ? (
            <Link href={`/avaliar/${job.id}`} className={cn(buttonVariants())}>
              Avaliar o atendimento
            </Link>
          ) : null}

          {canPropose ? (
            <Card>
              <CardHeader>
                <CardTitle>Enviar proposta</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const ok = dispatch({
                      type: "SEND_PROPOSAL",
                      input: {
                        requestId: request.id,
                        amountCents: Math.round(Number(amount.replace(",", ".")) * 100),
                        etaHours: Number(eta),
                        message: proposalMessage,
                      },
                    })
                    if (ok) toast.success("Proposta enviada ao cliente.")
                  }}
                >
                  <div className="space-y-1">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eta">Prazo (horas)</Label>
                    <Input
                      id="eta"
                      type="number"
                      min={1}
                      value={eta}
                      onChange={(event) => setEta(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pmessage">Como você resolve</Label>
                    <Textarea
                      id="pmessage"
                      value={proposalMessage}
                      onChange={(event) => setProposalMessage(event.target.value)}
                      placeholder="Peças, deslocamento, o que está incluso…"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Propor
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <div>
            <h2 className="font-heading mb-2 text-base">Propostas</h2>
            {proposals.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Nenhuma proposta ainda. O pedido continua visível para a categoria no raio.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {proposals.map((proposal) => (
                  <Card key={proposal.id}>
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/prestadores/${proposal.providerId}`}
                            className="font-medium hover:underline"
                          >
                            {proposal.provider?.user.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <StarRating value={proposal.provider?.provider.ratingAvg ?? 0} />
                            {proposal.provider ? (
                              <VerificationBadge
                                status={proposal.provider.provider.verificationStatus}
                              />
                            ) : null}
                          </div>
                        </div>
                        <p className="font-heading text-lg">{formatMoney(proposal.amountCents)}</p>
                      </div>
                      <p className="text-sm">{proposal.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Prazo estimado: {proposal.etaHours}h ·{" "}
                        {proposal.status === "ACCEPTED"
                          ? "Aceita"
                          : proposal.status === "DECLINED"
                            ? "Não escolhida"
                            : "Pendente"}
                      </p>
                      {canAccept && proposal.status === "PENDING" ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (dispatch({ type: "ACCEPT_PROPOSAL", proposalId: proposal.id })) {
                              toast.success("Pagamento retido. Combine o horário no chat.")
                            }
                          }}
                        >
                          Aceitar e reter pagamento
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
