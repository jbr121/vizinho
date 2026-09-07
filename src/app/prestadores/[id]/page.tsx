import { ProviderProfileView } from "@/components/views/provider-profile-view"
import { getStaticProviderIds } from "@/lib/static-params"

export function generateStaticParams() {
  return getStaticProviderIds().map((id) => ({ id }))
}

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProviderProfileView providerId={id} />
}
