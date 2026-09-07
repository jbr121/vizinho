import { ReviewView } from "@/components/views/review-view"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  return <ReviewView jobId={jobId} />
}
