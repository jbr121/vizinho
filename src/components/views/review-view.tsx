"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppShell } from "@/components/layout/app-shell"
import { StarRating } from "@/components/marketplace/star-rating"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMarketplace } from "@/infrastructure/store"
import { getCurrentUser } from "@/application/queries"

export function ReviewView({ jobId }: { jobId: string }) {
  const router = useRouter()
  const { state, dispatch } = useMarketplace()
  const user = getCurrentUser(state)
  const job = state.jobs.find((item) => item.id === jobId)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  if (!job || job.status !== "COMPLETED") {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Ainda não avaliável</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Só é possível avaliar depois que o serviço foi concluído e o pagamento liberado ou
          estornado.
        </p>
      </AppShell>
    )
  }

  const counterpartId = job.clientId === user.id ? job.providerId : job.clientId
  const counterpart = state.users.find((item) => item.id === counterpartId)
  const already = state.reviews.some(
    (review) => review.jobId === jobId && review.fromUserId === user.id,
  )

  if (already) {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Você já avaliou este serviço</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A reputação é bidirecional: cliente e prestador se avaliam uma vez por job.
        </p>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <h1 className="font-heading text-2xl">Avaliar {counterpart?.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Nota de 1 a 5 e um comentário público no perfil. Isso substitui o boca a boca do
        prédio.
      </p>
      <form
        className="mt-6 max-w-md space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const ok = dispatch({
            type: "SUBMIT_REVIEW",
            jobId,
            rating,
            comment,
          })
          if (ok) {
            toast.success("Avaliação publicada.")
            router.push(`/prestadores/${counterpartId}`)
          }
        }}
      >
        <div>
          <Label>Nota</Label>
          <div className="mt-2">
            <StarRating value={rating} size="md" onChange={setRating} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comment">Comentário</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Pontualidade, capricho, clareza no preço…"
            required
          />
        </div>
        <Button type="submit">Publicar avaliação</Button>
      </form>
    </AppShell>
  )
}
