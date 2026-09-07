import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 text-center">
      <h1 className="font-heading text-2xl">Página não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Esse caminho não existe no marketplace. Volte ao início e busque pelo bairro.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-4 self-center")}>
        Ir para o início
      </Link>
    </div>
  )
}
