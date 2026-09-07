import { Suspense } from "react"
import { SearchView } from "@/components/views/search-view"

export default function SearchPage() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  )
}
