import { RequestDetailView } from "@/components/views/request-detail-view"
import { getStaticRequestIds } from "@/lib/static-params"

export function generateStaticParams() {
  return getStaticRequestIds().map((id) => ({ id }))
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <RequestDetailView requestId={id} />
}
