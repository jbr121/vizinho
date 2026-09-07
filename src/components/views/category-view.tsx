"use client"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { CategoryIcon } from "@/components/marketplace/category-icon"
import { ProviderCard } from "@/components/marketplace/provider-card"
import { buttonVariants } from "@/components/ui/button"
import { useMarketplace } from "@/infrastructure/store"
import { listProvidersNearby } from "@/application/queries"
import { cn } from "@/lib/utils"

export function CategoryView({ slug }: { slug: string }) {
  const { state } = useMarketplace()
  const category = state.categories.find((item) => item.slug === slug)

  if (!category) {
    return (
      <AppShell>
        <h1 className="font-heading text-2xl">Categoria não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Essa especialidade não existe no catálogo atual.
        </p>
        <Link href="/" className={cn(buttonVariants(), "mt-4")}>
          Voltar ao início
        </Link>
      </AppShell>
    )
  }

  const results = listProvidersNearby(state, { categoryId: category.id })

  return (
    <AppShell>
      <div className="flex items-start gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CategoryIcon category={category} className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl">{category.name}</h1>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Link
          href={`/solicitar?categoria=${category.id}`}
          className={cn(buttonVariants())}
        >
          Pedir orçamento nesta categoria
        </Link>
        <Link href="/buscar" className={cn(buttonVariants({ variant: "outline" }))}>
          Ver todas as proximidades
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8">
            <p className="font-medium">Sem profissionais desta categoria no raio</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Publique o pedido mesmo assim: quem entrar no raio depois ainda pode propor.
            </p>
          </div>
        ) : (
          results.map((item) => <ProviderCard key={item.user.id} item={item} />)
        )}
      </div>
    </AppShell>
  )
}
