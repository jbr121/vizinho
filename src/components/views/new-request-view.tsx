"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMarketplace } from "@/infrastructure/store"
import { getCurrentUser } from "@/application/queries"

export function NewRequestView() {
  const router = useRouter()
  const params = useSearchParams()
  const { state, dispatch } = useMarketplace()
  const user = getCurrentUser(state)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState(
    params.get("categoria") ?? state.categories[0]?.id ?? "",
  )
  const [preferredProviderId] = useState(params.get("prestador"))
  const [scheduleType, setScheduleType] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE")
  const [scheduledAt, setScheduledAt] = useState("")
  const [files, setFiles] = useState<string[]>([])

  const preferred = useMemo(
    () => state.users.find((item) => item.id === preferredProviderId),
    [state.users, preferredProviderId],
  )

  if (user.role !== "CLIENT") {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Troque para um perfil de cliente</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Pedidos de orçamento saem da conta do consumidor. No menu do avatar, escolha Ana
          Ribeiro para continuar a demonstração.
        </p>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <h1 className="font-heading text-2xl">Pedir orçamento</h1>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Envie contexto de verdade: fotos, sintomas e se precisa de alguém agora ou em data
        marcada. Prestadores no raio respondem com preço e prazo.
      </p>

      {preferred ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm">
          Pedido direcionado a <strong>{preferred.name}</strong>. Outros da mesma categoria no
          raio ainda podem propor.
        </p>
      ) : null}

      <form
        className="mt-6 max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const ok = dispatch({
            type: "CREATE_REQUEST",
            input: {
              categoryId,
              title,
              description,
              attachments: files,
              scheduleType,
              scheduledAt: scheduleType === "SCHEDULED" && scheduledAt
                ? new Date(scheduledAt).toISOString()
                : null,
              preferredProviderId: preferredProviderId,
            },
          })
          if (ok) {
            toast.success("Pedido publicado. Prestadores próximos já podem responder.")
            router.push("/solicitacoes")
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="category">Categoria</Label>
          <select
            id="category"
            className="h-8 w-full rounded-lg border bg-background px-2.5 text-sm"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">O que precisa?</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Split pingando na parede do quarto"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Detalhes</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Marca, sintoma, acesso ao prédio…"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="files">Fotos ou vídeos</Label>
          <Input
            id="files"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(event) => {
              const next = Array.from(event.target.files ?? []).map((file) => file.name)
              setFiles(next)
            }}
          />
          {files.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Anexos na demo: {files.join(", ")} (não enviamos arquivo de verdade).
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Os arquivos ficam só no pedido, para o prestador avaliar o serviço.
            </p>
          )}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Quando</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="when"
              checked={scheduleType === "IMMEDIATE"}
              onChange={() => setScheduleType("IMMEDIATE")}
            />
            Preciso o quanto antes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="when"
              checked={scheduleType === "SCHEDULED"}
              onChange={() => setScheduleType("SCHEDULED")}
            />
            Combinar data e hora
          </label>
          {scheduleType === "SCHEDULED" ? (
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          ) : null}
        </fieldset>
        <Button type="submit">Publicar pedido</Button>
      </form>
    </AppShell>
  )
}
