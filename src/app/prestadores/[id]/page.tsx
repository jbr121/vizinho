import { ProviderProfileView } from "@/components/views/provider-profile-view"

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProviderProfileView providerId={id} />
}
