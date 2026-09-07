import { DomainError } from "@/domain/errors"
import type {
  ChatMessage,
  Job,
  MarketplaceState,
  Payment,
  Proposal,
  ProviderDocument,
  Review,
  ServiceRequest,
} from "@/domain/entities"
import { PLATFORM_FEE_RATE } from "@/infrastructure/seed"

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function nowIso() {
  return new Date().toISOString()
}

export type CreateRequestInput = {
  categoryId: string
  title: string
  description: string
  attachments: string[]
  scheduleType: ServiceRequest["scheduleType"]
  scheduledAt: string | null
  preferredProviderId: string | null
}

export type SendProposalInput = {
  requestId: string
  amountCents: number
  etaHours: number
  message: string
}

export type MarketplaceAction =
  | { type: "SWITCH_USER"; userId: string }
  | { type: "SET_NEIGHBORHOOD"; neighborhoodId: string }
  | { type: "CREATE_REQUEST"; input: CreateRequestInput }
  | { type: "SEND_MESSAGE"; requestId: string; body: string }
  | { type: "SEND_PROPOSAL"; input: SendProposalInput }
  | { type: "ACCEPT_PROPOSAL"; proposalId: string }
  | { type: "START_JOB"; jobId: string }
  | { type: "COMPLETE_JOB"; jobId: string }
  | { type: "CONFIRM_COMPLETION"; jobId: string }
  | { type: "SUBMIT_REVIEW"; jobId: string; rating: number; comment: string }
  | { type: "OPEN_DISPUTE"; requestId: string }
  | { type: "RESOLVE_DISPUTE"; requestId: string; releaseToProvider: boolean }
  | { type: "REVIEW_DOCUMENT"; documentId: string; approve: boolean }
  | { type: "RESET" }

export function reduceMarketplace(
  state: MarketplaceState,
  action: MarketplaceAction,
  seedFactory: () => MarketplaceState,
): MarketplaceState {
  switch (action.type) {
    case "RESET":
      return seedFactory()
    case "SWITCH_USER":
      return { ...state, currentUserId: action.userId }
    case "SET_NEIGHBORHOOD":
      return setNeighborhood(state, action.neighborhoodId)
    case "CREATE_REQUEST":
      return createRequest(state, action.input)
    case "SEND_MESSAGE":
      return sendMessage(state, action.requestId, action.body)
    case "SEND_PROPOSAL":
      return sendProposal(state, action.input)
    case "ACCEPT_PROPOSAL":
      return acceptProposal(state, action.proposalId)
    case "START_JOB":
      return startJob(state, action.jobId)
    case "COMPLETE_JOB":
      return completeJob(state, action.jobId)
    case "CONFIRM_COMPLETION":
      return confirmCompletion(state, action.jobId)
    case "SUBMIT_REVIEW":
      return submitReview(state, action.jobId, action.rating, action.comment)
    case "OPEN_DISPUTE":
      return openDispute(state, action.requestId)
    case "RESOLVE_DISPUTE":
      return resolveDispute(state, action.requestId, action.releaseToProvider)
    case "REVIEW_DOCUMENT":
      return reviewDocument(state, action.documentId, action.approve)
    default:
      return state
  }
}

function requireUser(state: MarketplaceState) {
  const user = state.users.find((item) => item.id === state.currentUserId)
  if (!user) {
    throw new DomainError("USER_NOT_FOUND", "Sessão inválida. Troque o perfil e tente de novo.")
  }
  return user
}

function setNeighborhood(state: MarketplaceState, neighborhoodId: string): MarketplaceState {
  const neighborhood = state.neighborhoods.find((item) => item.id === neighborhoodId)
  if (!neighborhood) {
    throw new DomainError("NEIGHBORHOOD_NOT_FOUND", "Bairro não encontrado.")
  }

  const clients = state.clients.map((client) =>
    client.userId === state.currentUserId
      ? {
          ...client,
          neighborhood: neighborhood.name,
          city: neighborhood.city,
          location: neighborhood.location,
        }
      : client,
  )

  return { ...state, activeNeighborhoodId: neighborhoodId, clients }
}

function createRequest(state: MarketplaceState, input: CreateRequestInput): MarketplaceState {
  const user = requireUser(state)
  if (user.role !== "CLIENT") {
    throw new DomainError("FORBIDDEN", "Só o cliente pode pedir orçamento.")
  }
  if (!input.title.trim() || !input.description.trim()) {
    throw new DomainError("INVALID_REQUEST", "Descreva o serviço, título e detalhes.")
  }

  const client = state.clients.find((item) => item.userId === user.id)
  if (!client) {
    throw new DomainError("PROFILE_MISSING", "Perfil de cliente incompleto.")
  }

  const request: ServiceRequest = {
    id: id("req"),
    clientId: user.id,
    categoryId: input.categoryId,
    title: input.title.trim(),
    description: input.description.trim(),
    attachments: input.attachments,
    address: client.address,
    location: client.location,
    scheduleType: input.scheduleType,
    scheduledAt: input.scheduledAt,
    preferredProviderId: input.preferredProviderId,
    status: "OPEN",
    createdAt: nowIso(),
  }

  const system: ChatMessage = {
    id: id("msg"),
    requestId: request.id,
    senderId: user.id,
    type: "SYSTEM",
    body: input.preferredProviderId
      ? "Pedido enviado ao profissional escolhido. Outros prestadores da categoria no raio também podem propor."
      : "Pedido publicado. Prestadores próximos da categoria já podem enviar proposta.",
    createdAt: nowIso(),
  }

  return {
    ...state,
    requests: [request, ...state.requests],
    messages: [...state.messages, system],
  }
}

function sendMessage(
  state: MarketplaceState,
  requestId: string,
  body: string,
): MarketplaceState {
  const user = requireUser(state)
  const text = body.trim()
  if (!text) {
    throw new DomainError("EMPTY_MESSAGE", "Escreva uma mensagem antes de enviar.")
  }

  const request = state.requests.find((item) => item.id === requestId)
  if (!request) {
    throw new DomainError("REQUEST_NOT_FOUND", "Solicitação não encontrada.")
  }

  const involvedProviderIds = state.proposals
    .filter((proposal) => proposal.requestId === requestId)
    .map((proposal) => proposal.providerId)

  const canTalk =
    user.role === "ADMIN" ||
    request.clientId === user.id ||
    involvedProviderIds.includes(user.id) ||
    request.preferredProviderId === user.id

  if (!canTalk) {
    throw new DomainError("FORBIDDEN", "Você não participa desta conversa.")
  }

  const message: ChatMessage = {
    id: id("msg"),
    requestId,
    senderId: user.id,
    type: "TEXT",
    body: text,
    createdAt: nowIso(),
  }

  return { ...state, messages: [...state.messages, message] }
}

function sendProposal(state: MarketplaceState, input: SendProposalInput): MarketplaceState {
  const user = requireUser(state)
  if (user.role !== "PROVIDER") {
    throw new DomainError("FORBIDDEN", "Só o prestador pode enviar proposta.")
  }

  const provider = state.providers.find((item) => item.userId === user.id)
  if (!provider) {
    throw new DomainError("PROFILE_MISSING", "Perfil de prestador incompleto.")
  }
  if (provider.verificationStatus === "REJECTED") {
    throw new DomainError("UNVERIFIED", "Sua conta foi recusada pela moderação.")
  }

  const request = state.requests.find((item) => item.id === input.requestId)
  if (!request) {
    throw new DomainError("REQUEST_NOT_FOUND", "Solicitação não encontrada.")
  }
  if (!["OPEN", "PROPOSALS_RECEIVED"].includes(request.status)) {
    throw new DomainError("REQUEST_CLOSED", "Esta solicitação não aceita propostas.")
  }
  if (!provider.specialtyCategoryIds.includes(request.categoryId)) {
    throw new DomainError("WRONG_CATEGORY", "Esta categoria não está nas suas especialidades.")
  }
  if (input.amountCents < 5000) {
    throw new DomainError("INVALID_PRICE", "O valor mínimo para proposta é R$ 50.")
  }

  const already = state.proposals.some(
    (proposal) => proposal.requestId === request.id && proposal.providerId === user.id,
  )
  if (already) {
    throw new DomainError("DUPLICATE_PROPOSAL", "Você já enviou uma proposta neste pedido.")
  }

  const proposal: Proposal = {
    id: id("prop"),
    requestId: request.id,
    providerId: user.id,
    amountCents: input.amountCents,
    etaHours: input.etaHours,
    message: input.message.trim(),
    status: "PENDING",
    createdAt: nowIso(),
  }

  const message: ChatMessage = {
    id: id("msg"),
    requestId: request.id,
    senderId: user.id,
    type: "SYSTEM",
    body: `${user.name} enviou uma proposta de ${(input.amountCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}.`,
    createdAt: nowIso(),
  }

  return {
    ...state,
    proposals: [...state.proposals, proposal],
    requests: state.requests.map((item) =>
      item.id === request.id ? { ...item, status: "PROPOSALS_RECEIVED" } : item,
    ),
    messages: [...state.messages, message],
  }
}

function acceptProposal(state: MarketplaceState, proposalId: string): MarketplaceState {
  const user = requireUser(state)
  const proposal = state.proposals.find((item) => item.id === proposalId)
  if (!proposal) {
    throw new DomainError("PROPOSAL_NOT_FOUND", "Proposta não encontrada.")
  }

  const request = state.requests.find((item) => item.id === proposal.requestId)
  if (!request || request.clientId !== user.id) {
    throw new DomainError("FORBIDDEN", "Só o cliente do pedido pode aceitar a proposta.")
  }

  const fee = Math.round(proposal.amountCents * PLATFORM_FEE_RATE)
  const job: Job = {
    id: id("job"),
    requestId: request.id,
    proposalId: proposal.id,
    clientId: request.clientId,
    providerId: proposal.providerId,
    status: "SCHEDULED",
    scheduledAt: request.scheduledAt,
    startedAt: null,
    completedAt: null,
  }

  const payment: Payment = {
    id: id("pay"),
    jobId: job.id,
    amountCents: proposal.amountCents,
    platformFeeCents: fee,
    providerAmountCents: proposal.amountCents - fee,
    status: "HELD",
    createdAt: nowIso(),
    releasedAt: null,
  }

  const providerUser = state.users.find((item) => item.id === proposal.providerId)
  const message: ChatMessage = {
    id: id("msg"),
    requestId: request.id,
    senderId: user.id,
    type: "SYSTEM",
    body: `Proposta aceita. R$ ${(proposal.amountCents / 100).toFixed(2).replace(".", ",")} ficou retido em garantia até combinar com ${providerUser?.name ?? "o prestador"}.`,
    createdAt: nowIso(),
  }

  return {
    ...state,
    jobs: [...state.jobs, job],
    payments: [...state.payments, payment],
    proposals: state.proposals.map((item) => {
      if (item.requestId !== request.id) return item
      if (item.id === proposal.id) return { ...item, status: "ACCEPTED" }
      return { ...item, status: "DECLINED" }
    }),
    requests: state.requests.map((item) =>
      item.id === request.id
        ? {
            ...item,
            status: request.scheduleType === "SCHEDULED" ? "SCHEDULED" : "ACCEPTED",
          }
        : item,
    ),
    messages: [...state.messages, message],
  }
}

function startJob(state: MarketplaceState, jobId: string): MarketplaceState {
  const user = requireUser(state)
  const job = state.jobs.find((item) => item.id === jobId)
  if (!job || job.providerId !== user.id) {
    throw new DomainError("FORBIDDEN", "Só o prestador do serviço pode iniciar o atendimento.")
  }
  if (job.status !== "SCHEDULED") {
    throw new DomainError("INVALID_STATUS", "Este serviço já foi iniciado ou encerrado.")
  }

  const message: ChatMessage = {
    id: id("msg"),
    requestId: job.requestId,
    senderId: user.id,
    type: "SYSTEM",
    body: `${user.name} iniciou o atendimento. O valor continua retido.`,
    createdAt: nowIso(),
  }

  return {
    ...state,
    jobs: state.jobs.map((item) =>
      item.id === jobId
        ? { ...item, status: "IN_PROGRESS", startedAt: nowIso() }
        : item,
    ),
    requests: state.requests.map((item) =>
      item.id === job.requestId ? { ...item, status: "IN_PROGRESS" } : item,
    ),
    messages: [...state.messages, message],
  }
}

function completeJob(state: MarketplaceState, jobId: string): MarketplaceState {
  const user = requireUser(state)
  const job = state.jobs.find((item) => item.id === jobId)
  if (!job || job.providerId !== user.id) {
    throw new DomainError("FORBIDDEN", "Só o prestador pode marcar o serviço como concluído.")
  }
  if (job.status !== "IN_PROGRESS") {
    throw new DomainError("INVALID_STATUS", "Inicie o atendimento antes de concluir.")
  }

  const message: ChatMessage = {
    id: id("msg"),
    requestId: job.requestId,
    senderId: user.id,
    type: "SYSTEM",
    body: `${user.name} marcou o serviço como concluído. Confirme para liberar o repasse.`,
    createdAt: nowIso(),
  }

  return {
    ...state,
    jobs: state.jobs.map((item) =>
      item.id === jobId ? { ...item, completedAt: nowIso() } : item,
    ),
    messages: [...state.messages, message],
  }
}

function confirmCompletion(state: MarketplaceState, jobId: string): MarketplaceState {
  const user = requireUser(state)
  const job = state.jobs.find((item) => item.id === jobId)
  if (!job || job.clientId !== user.id) {
    throw new DomainError("FORBIDDEN", "Só o cliente confirma a conclusão.")
  }
  if (!job.completedAt) {
    throw new DomainError("INVALID_STATUS", "Aguarde o prestador marcar o serviço como concluído.")
  }

  const payment = state.payments.find((item) => item.jobId === job.id)
  const message: ChatMessage = {
    id: id("msg"),
    requestId: job.requestId,
    senderId: user.id,
    type: "SYSTEM",
    body: payment
      ? `Serviço confirmado. Repasse de R$ ${(payment.providerAmountCents / 100).toFixed(2).replace(".", ",")} liberado ao prestador.`
      : "Serviço confirmado.",
    createdAt: nowIso(),
  }

  return {
    ...state,
    jobs: state.jobs.map((item) =>
      item.id === jobId ? { ...item, status: "COMPLETED" } : item,
    ),
    requests: state.requests.map((item) =>
      item.id === job.requestId ? { ...item, status: "COMPLETED" } : item,
    ),
    payments: state.payments.map((item) =>
      item.jobId === jobId
        ? { ...item, status: "RELEASED", releasedAt: nowIso() }
        : item,
    ),
    providers: state.providers.map((item) =>
      item.userId === job.providerId
        ? { ...item, completedJobs: item.completedJobs + 1 }
        : item,
    ),
    messages: [...state.messages, message],
  }
}

function submitReview(
  state: MarketplaceState,
  jobId: string,
  rating: number,
  comment: string,
): MarketplaceState {
  const user = requireUser(state)
  if (rating < 1 || rating > 5) {
    throw new DomainError("INVALID_RATING", "A nota precisa ser de 1 a 5 estrelas.")
  }

  const job = state.jobs.find((item) => item.id === jobId)
  if (!job || job.status !== "COMPLETED") {
    throw new DomainError("JOB_NOT_READY", "Avalie somente após a conclusão.")
  }

  const counterpartId =
    job.clientId === user.id
      ? job.providerId
      : job.providerId === user.id
        ? job.clientId
        : null
  if (!counterpartId) {
    throw new DomainError("FORBIDDEN", "Você não participou deste serviço.")
  }

  const already = state.reviews.some(
    (review) => review.jobId === jobId && review.fromUserId === user.id,
  )
  if (already) {
    throw new DomainError("DUPLICATE_REVIEW", "Você já avaliou este serviço.")
  }

  const review: Review = {
    id: id("rev"),
    jobId,
    fromUserId: user.id,
    toUserId: counterpartId,
    rating,
    comment: comment.trim(),
    createdAt: nowIso(),
  }

  const subjectReviews = [...state.reviews, review].filter((item) => item.toUserId === counterpartId)
  const avg =
    subjectReviews.reduce((sum, item) => sum + item.rating, 0) / subjectReviews.length

  return {
    ...state,
    reviews: [...state.reviews, review],
    providers: state.providers.map((item) =>
      item.userId === counterpartId
        ? { ...item, ratingAvg: Number(avg.toFixed(1)), ratingCount: subjectReviews.length }
        : item,
    ),
  }
}

function openDispute(state: MarketplaceState, requestId: string): MarketplaceState {
  const user = requireUser(state)
  const request = state.requests.find((item) => item.id === requestId)
  if (!request || (request.clientId !== user.id && user.role !== "ADMIN")) {
    throw new DomainError("FORBIDDEN", "Não foi possível abrir a disputa.")
  }

  const message: ChatMessage = {
    id: id("msg"),
    requestId,
    senderId: user.id,
    type: "SYSTEM",
    body: "Disputa aberta. O valor permanece retido até a moderação decidir o repasse.",
    createdAt: nowIso(),
  }

  return {
    ...state,
    requests: state.requests.map((item) =>
      item.id === requestId ? { ...item, status: "DISPUTED" } : item,
    ),
    messages: [...state.messages, message],
  }
}

function resolveDispute(
  state: MarketplaceState,
  requestId: string,
  releaseToProvider: boolean,
): MarketplaceState {
  const user = requireUser(state)
  if (user.role !== "ADMIN") {
    throw new DomainError("FORBIDDEN", "Apenas a moderação resolve disputas.")
  }

  const job = state.jobs.find((item) => item.requestId === requestId)
  const message: ChatMessage = {
    id: id("msg"),
    requestId,
    senderId: user.id,
    type: "SYSTEM",
    body: releaseToProvider
      ? "Disputa encerrada. O valor retido foi liberado ao prestador."
      : "Disputa encerrada. O valor retido foi estornado ao cliente.",
    createdAt: nowIso(),
  }

  return {
    ...state,
    requests: state.requests.map((item) =>
      item.id === requestId ? { ...item, status: "COMPLETED" } : item,
    ),
    jobs: state.jobs.map((item) =>
      item.requestId === requestId ? { ...item, status: "COMPLETED" } : item,
    ),
    payments: state.payments.map((item) =>
      job && item.jobId === job.id
        ? {
            ...item,
            status: releaseToProvider ? "RELEASED" : "REFUNDED",
            releasedAt: nowIso(),
          }
        : item,
    ),
    messages: [...state.messages, message],
  }
}

function reviewDocument(
  state: MarketplaceState,
  documentId: string,
  approve: boolean,
): MarketplaceState {
  const user = requireUser(state)
  if (user.role !== "ADMIN") {
    throw new DomainError("FORBIDDEN", "Apenas a moderação verifica documentos.")
  }

  const document = state.documents.find((item) => item.id === documentId)
  if (!document) {
    throw new DomainError("DOCUMENT_NOT_FOUND", "Documento não encontrado.")
  }

  const documents = state.documents.map((item) =>
    item.id === documentId
      ? {
          ...item,
          status: (approve ? "APPROVED" : "REJECTED") as ProviderDocument["status"],
          notes: approve ? "Documento conferido." : "Documento ilegível ou inconsistente.",
        }
      : item,
  )

  const providerDocs = documents.filter((item) => item.providerId === document.providerId)
  const allApproved = providerDocs.every((item) => item.status === "APPROVED")
  const anyRejected = providerDocs.some((item) => item.status === "REJECTED")

  return {
    ...state,
    documents,
    providers: state.providers.map((item) =>
      item.userId === document.providerId
        ? {
            ...item,
            verificationStatus: allApproved
              ? "APPROVED"
              : anyRejected
                ? "REJECTED"
                : "PENDING",
          }
        : item,
    ),
  }
}
