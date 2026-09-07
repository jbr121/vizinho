"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { ProviderCard } from "@/components/marketplace/provider-card"
import { NeighborhoodRadar } from "@/components/marketplace/neighborhood-radar"
import { Input } from "@/components/ui/input"
import { useMarketplace } from "@/infrastructure/store"
import { getOrigin, listProvidersNearby } from "@/application/queries"

export function SearchView() {
  const params = useSearchParams()
  const { state } = useMarketplace()
  const [query, setQuery] = useState(params.get("q") ?? "")
  const [categoryId, setCategoryId] = useState(params.get("categoria") ?? "")
  const [maxKm, setMaxKm] = useState(12)
  const origin = getOrigin(state)
  const neighborhood =
    state.neighborhoods.find((item) => item.id === state.activeNeighborhoodId)?.name ??
    "Pinheiros"

  const results = useMemo(
    () =>
      listProvidersNearby(state, {
        query,
        categoryId: categoryId || undefined,
        maxKm,
      }),
    [state, query, categoryId, maxKm],
  )

  return (
    <AppShell>
      <h1 className="font-heading text-2xl">Busca por proximidade</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Profissionais ordenados pela distância em {neighborhood}. Quem estiver fora do próprio raio
        de atendimento aparece por último.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome, especialidade ou bairro"
        />
        <select
          className="h-8 rounded-lg border bg-background px-2.5 text-sm"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Todas as categorias</option>
          {state.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="h-8 rounded-lg border bg-background px-2.5 text-sm"
          value={maxKm}
          onChange={(event) => setMaxKm(Number(event.target.value))}
        >
          <option value={4}>Até 4 km</option>
          <option value={8}>Até 8 km</option>
          <option value={12}>Até 12 km</option>
          <option value={20}>Até 20 km</option>
        </select>
      </div>

      <div className="mt-6">
        <NeighborhoodRadar items={results} origin={origin} originLabel={neighborhood} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">Nenhum prestador neste filtro</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Solte a categoria, aumente o raio ou mude o bairro no cabeçalho.
            </p>
          </div>
        ) : (
          results.map((item) => <ProviderCard key={item.user.id} item={item} />)
        )}
      </div>
    </AppShell>
  )
}
