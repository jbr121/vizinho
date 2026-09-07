"use client"

import { useCallback, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { isDomainError } from "@/domain/errors"
import type { MarketplaceState } from "@/domain/entities"
import { createSeedState } from "@/infrastructure/seed"
import {
  reduceMarketplace,
  type MarketplaceAction,
} from "@/infrastructure/reducer"

let state: MarketplaceState = createSeedState()
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export function dispatch(action: MarketplaceAction) {
  try {
    state = reduceMarketplace(state, action, createSeedState)
    emit()
    return true
  } catch (error) {
    const message = isDomainError(error)
      ? error.message
      : "Não foi possível concluir esta ação. Tente novamente."
    toast.error(message)
    return false
  }
}

export function useMarketplace() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const run = useCallback((action: MarketplaceAction) => dispatch(action), [])

  return { state: snapshot, dispatch: run }
}
