import { CategoryView } from "@/components/views/category-view"
import { getStaticCategorySlugs } from "@/lib/static-params"

export function generateStaticParams() {
  return getStaticCategorySlugs().map((slug) => ({ slug }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <CategoryView slug={slug} />
}
