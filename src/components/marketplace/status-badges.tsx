import { Badge } from "@/components/ui/badge"
import {
  paymentStatusLabel,
  requestStatusLabel,
  verificationLabel,
} from "@/application/queries"

const requestVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "outline",
  PROPOSALS_RECEIVED: "secondary",
  ACCEPTED: "default",
  SCHEDULED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "outline",
  DISPUTED: "destructive",
}

export function RequestStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={requestVariant[status] ?? "outline"}>
      {requestStatusLabel[status] ?? status}
    </Badge>
  )
}

export function VerificationBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "APPROVED" ? "default" : status === "REJECTED" ? "destructive" : "outline"}>
      {verificationLabel[status] ?? status}
    </Badge>
  )
}

export function PaymentBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "HELD" ? "secondary" : status === "RELEASED" ? "default" : "outline"}>
      {paymentStatusLabel[status] ?? status}
    </Badge>
  )
}
