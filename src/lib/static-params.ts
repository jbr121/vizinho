import { createSeedState } from "@/infrastructure/seed"

export function getStaticCategorySlugs() {
  return createSeedState().categories.map((category) => category.slug)
}

export function getStaticProviderIds() {
  return createSeedState().providers.map((provider) => provider.userId)
}

export function getStaticRequestIds() {
  return createSeedState().requests.map((request) => request.id)
}

export function getStaticJobIds() {
  return createSeedState().jobs.map((job) => job.id)
}
