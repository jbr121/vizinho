export type UserRole = "CLIENT" | "PROVIDER" | "ADMIN"

export type VerificationStatus = "UNSUBMITTED" | "PENDING" | "APPROVED" | "REJECTED"

export type RequestStatus =
  | "OPEN"
  | "PROPOSALS_RECEIVED"
  | "ACCEPTED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"

export type ScheduleType = "IMMEDIATE" | "SCHEDULED"

export type ProposalStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN"

export type JobStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

export type PaymentStatus = "PENDING" | "HELD" | "RELEASED" | "REFUNDED" | "FAILED"

export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "SYSTEM"

export type DocumentType = "RG" | "CNH" | "MEI" | "RESIDENCIA" | "ANTECEDENTES"

export type GeoPoint = {
  lat: number
  lng: number
}

export type User = {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  initials: string
  accent: string
}

export type ClientProfile = {
  userId: string
  address: string
  neighborhood: string
  city: string
  location: GeoPoint
}

export type ProviderProfile = {
  userId: string
  bio: string
  radiusKm: number
  location: GeoPoint
  neighborhood: string
  verificationStatus: VerificationStatus
  ratingAvg: number
  ratingCount: number
  completedJobs: number
  yearsExperience: number
  startingPriceCents: number
  specialtyCategoryIds: string[]
}

export type Category = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
}

export type Neighborhood = {
  id: string
  name: string
  city: string
  location: GeoPoint
}

export type ServiceRequest = {
  id: string
  clientId: string
  categoryId: string
  title: string
  description: string
  attachments: string[]
  address: string
  location: GeoPoint
  scheduleType: ScheduleType
  scheduledAt: string | null
  preferredProviderId: string | null
  status: RequestStatus
  createdAt: string
}

export type Proposal = {
  id: string
  requestId: string
  providerId: string
  amountCents: number
  etaHours: number
  message: string
  status: ProposalStatus
  createdAt: string
}

export type Job = {
  id: string
  requestId: string
  proposalId: string
  clientId: string
  providerId: string
  status: JobStatus
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
}

export type ChatMessage = {
  id: string
  requestId: string
  senderId: string
  type: MessageType
  body: string
  createdAt: string
}

export type Review = {
  id: string
  jobId: string
  fromUserId: string
  toUserId: string
  rating: number
  comment: string
  createdAt: string
}

export type Payment = {
  id: string
  jobId: string
  amountCents: number
  platformFeeCents: number
  providerAmountCents: number
  status: PaymentStatus
  createdAt: string
  releasedAt: string | null
}

export type ProviderDocument = {
  id: string
  providerId: string
  type: DocumentType
  fileName: string
  status: VerificationStatus
  submittedAt: string
  notes: string | null
}

export type MarketplaceState = {
  users: User[]
  clients: ClientProfile[]
  providers: ProviderProfile[]
  categories: Category[]
  neighborhoods: Neighborhood[]
  requests: ServiceRequest[]
  proposals: Proposal[]
  jobs: Job[]
  messages: ChatMessage[]
  reviews: Review[]
  payments: Payment[]
  documents: ProviderDocument[]
  currentUserId: string
  activeNeighborhoodId: string
}
