import { CategoryView } from "@/components/views/category-view"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <CategoryView slug={slug} />
}
