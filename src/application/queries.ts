import { distanceKm } from "@/domain/geo"
import type {
  Category,
  GeoPoint,
  MarketplaceState,
  ProviderProfile,
  User,
} from "@/domain/entities"

export type ProviderListItem = {
  provider: ProviderProfile
  user: User
  distanceKm: number
  categories: Category[]
  inRadius: boolean
}

export function getCurrentUser(state: MarketplaceState) {
  const user = state.users.find((item) => item.id === state.currentUserId)
  if (!user) {
    throw new Error("Usuário atual não encontrado")
  }
  return user
}

export function getOrigin(state: MarketplaceState): GeoPoint {
  const client = state.clients.find((item) => item.userId === state.currentUserId)
  if (client) return client.location
  const neighborhood = state.neighborhoods.find(
    (item) => item.id === state.activeNeighborhoodId,
  )
  return neighborhood?.location ?? { lat: -23.5674, lng: -46.6934 }
}

export function listProvidersNearby(
  state: MarketplaceState,
  options?: { categoryId?: string; query?: string; maxKm?: number },
): ProviderListItem[] {
  const origin = getOrigin(state)
  const query = options?.query?.trim().toLowerCase() ?? ""

  return state.providers
    .map((provider) => {
      const user = state.users.find((item) => item.id === provider.userId)
      if (!user) return null
      const km = distanceKm(origin, provider.location)
      const categories = state.categories.filter((category) =>
        provider.specialtyCategoryIds.includes(category.id),
      )
      return {
        provider,
        user,
        distanceKm: km,
        categories,
        inRadius: km <= provider.radiusKm,
      }
    })
    .filter((item): item is ProviderListItem => {
      if (!item) return false
      if (options?.categoryId && !item.provider.specialtyCategoryIds.includes(options.categoryId)) {
        return false
      }
      if (options?.maxKm !== undefined && item.distanceKm > options.maxKm) {
        return false
      }
      if (query) {
        const haystack = [
          item.user.name,
          item.provider.bio,
          item.provider.neighborhood,
          ...item.categories.map((category) => category.name),
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

export function getProviderView(state: MarketplaceState, providerId: string) {
  const provider = state.providers.find((item) => item.userId === providerId)
  const user = state.users.find((item) => item.id === providerId)
  if (!provider || !user) return null

  const origin = getOrigin(state)
  const reviews = state.reviews
    .filter((review) => review.toUserId === providerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    provider,
    user,
    distanceKm: distanceKm(origin, provider.location),
    categories: state.categories.filter((category) =>
      provider.specialtyCategoryIds.includes(category.id),
    ),
    reviews: reviews.map((review) => ({
      ...review,
      from: state.users.find((item) => item.id === review.fromUserId),
    })),
    documents: state.documents.filter((document) => document.providerId === providerId),
  }
}

export function requestsForUser(state: MarketplaceState) {
  const user = getCurrentUser(state)
  if (user.role === "CLIENT") {
    return state.requests.filter((request) => request.clientId === user.id)
  }
  if (user.role === "PROVIDER") {
    const mine = new Set(
      state.proposals
        .filter((proposal) => proposal.providerId === user.id)
        .map((proposal) => proposal.requestId),
    )
    const openForSpecialty = state.requests.filter((request) => {
      const provider = state.providers.find((item) => item.userId === user.id)
      if (!provider) return false
      const isOpen = request.status === "OPEN" || request.status === "PROPOSALS_RECEIVED"
      const matchesCategory = provider.specialtyCategoryIds.includes(request.categoryId)
      const preferred = request.preferredProviderId === user.id
      return (isOpen && matchesCategory) || preferred || mine.has(request.id)
    })
    return openForSpecialty
  }
  return state.requests
}

export function getRequestView(state: MarketplaceState, requestId: string) {
  const request = state.requests.find((item) => item.id === requestId)
  if (!request) return null

  const client = state.users.find((item) => item.id === request.clientId)
  const category = state.categories.find((item) => item.id === request.categoryId)
  const proposals = state.proposals
    .filter((proposal) => proposal.requestId === requestId)
    .map((proposal) => ({
      ...proposal,
      provider: getProviderView(state, proposal.providerId),
    }))
    .sort((a, b) => a.amountCents - b.amountCents)
  const job = state.jobs.find((item) => item.requestId === requestId) ?? null
  const payment = job
    ? (state.payments.find((item) => item.jobId === job.id) ?? null)
    : null
  const messages = state.messages
    .filter((message) => message.requestId === requestId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((message) => ({
      ...message,
      sender: state.users.find((item) => item.id === message.senderId),
    }))
  const reviews = job
    ? state.reviews.filter((review) => review.jobId === job.id)
    : []

  return {
    request,
    client,
    category,
    proposals,
    job,
    payment,
    messages,
    reviews,
  }
}

export function adminQueue(state: MarketplaceState) {
  return {
    pendingDocuments: state.documents.filter((document) => document.status === "PENDING"),
    disputes: state.requests.filter((request) => request.status === "DISPUTED"),
    heldPayments: state.payments.filter((payment) => payment.status === "HELD"),
    unverifiedProviders: state.providers.filter(
      (provider) => provider.verificationStatus !== "APPROVED",
    ),
  }
}

export const requestStatusLabel: Record<string, string> = {
  OPEN: "Aguardando propostas",
  PROPOSALS_RECEIVED: "Propostas recebidas",
  ACCEPTED: "Proposta aceita",
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  DISPUTED: "Em disputa",
}

export const verificationLabel: Record<string, string> = {
  UNSUBMITTED: "Sem documentos",
  PENDING: "Em análise",
  APPROVED: "Verificado",
  REJECTED: "Recusado",
}

export const paymentStatusLabel: Record<string, string> = {
  PENDING: "Aguardando",
  HELD: "Retido (escrow)",
  RELEASED: "Repassado",
  REFUNDED: "Estornado",
  FAILED: "Falhou",
}
