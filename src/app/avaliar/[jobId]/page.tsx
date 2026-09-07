import { ReviewView } from "@/components/views/review-view"
import { getStaticJobIds } from "@/lib/static-params"

export function generateStaticParams() {
  return getStaticJobIds().map((jobId) => ({ jobId }))
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  return <ReviewView jobId={jobId} />
}
