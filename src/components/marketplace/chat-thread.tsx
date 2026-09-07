"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ChatMessage, User } from "@/domain/entities"

type ThreadMessage = ChatMessage & { sender?: User }

export function ChatThread({
  messages,
  currentUserId,
  onSend,
}: {
  messages: ThreadMessage[]
  currentUserId: string
  onSend: (body: string) => boolean
}) {
  const [draft, setDraft] = useState("")

  function submit() {
    if (onSend(draft)) {
      setDraft("")
    }
  }

  return (
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-xl border bg-card">
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Descreva o problema, envie fotos ou combine o horário.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              if (message.type === "SYSTEM") {
                return (
                  <p
                    key={message.id}
                    className="mx-auto max-w-[90%] rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground"
                  >
                    {message.body}
                  </p>
                )
              }

              const mine = message.senderId === currentUserId
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}
                >
                  {!mine ? (
                    <div
                      className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ background: message.sender?.accent ?? "#567" }}
                    >
                      {message.sender?.initials ?? "?"}
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted",
                    )}
                  >
                    {!mine ? (
                      <p className="mb-0.5 text-[11px] font-medium opacity-80">
                        {message.sender?.name}
                      </p>
                    ) : null}
                    <p>{message.body}</p>
                    <p className={cn("mt-1 text-[10px]", mine ? "opacity-80" : "text-muted-foreground")}>
                      {formatRelative(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Mensagem, dúvida ou combinação de horário"
          className="min-h-12 resize-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
        />
        <Button type="submit" size="icon" aria-label="Enviar mensagem">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
