export function productDetailHref(product: { slug?: string | null; externalUrl?: string | null }): string {
  if (product.slug) return `/health-mall/${product.slug}`
  return product.externalUrl || '#'
}

export function productLinkOpensInNewTab(href: string): boolean {
  if (!href || href === '#') return false
  if (href.startsWith('/')) return false
  try {
    const { hostname } = new URL(href)
    return hostname !== 'www.bedee.com' && hostname !== 'bedee.com'
  } catch {
    return false
  }
}
