import { Suspense } from "react"
import { NewRequestView } from "@/components/views/new-request-view"

export default function NewRequestPage() {
  return (
    <Suspense>
      <NewRequestView />
    </Suspense>
  )
}
