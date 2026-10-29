/** Detail URL for a promotion card — prefer in-app route over legacy absolute ctaUrl. */
export function promotionDetailHref(promo: { slug?: string | null; ctaUrl?: string | null }): string {
  if (promo.slug) return `/promotion/${promo.slug}`
  return promo.ctaUrl || '#'
}

export function promotionLinkOpensInNewTab(href: string): boolean {
  if (!href || href === '#') return false
  if (href.startsWith('/')) return false
  try {
    const { hostname } = new URL(href)
    return hostname !== 'www.bedee.com' && hostname !== 'bedee.com'
  } catch {
    return false
  }
}
