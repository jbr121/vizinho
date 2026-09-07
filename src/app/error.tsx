"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 text-center">
      <h1 className="font-heading text-2xl">Algo saiu do esperado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Recarregue esta tela. Se o erro continuar, restaure a demonstração no menu do avatar.
      </p>
      <Button className="mt-4 self-center" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  )
}
