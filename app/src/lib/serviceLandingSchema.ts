import { SITE_URL } from '@/lib/siteUrl'

/** Top-level marketing routes backed by `pages`, not the empty `services` collection. */
export const SERVICE_LANDING_SLUGS = [
  'teleconsultation',
  'telepharmacy',
  'health-mall',
  'health-plaza',
] as const

export type ServiceLandingSlug = (typeof SERVICE_LANDING_SLUGS)[number]

const SERVICE_META: Record<
  ServiceLandingSlug,
  { serviceType: string; alternateName: string; audienceType?: string }
> = {
  telepharmacy: {
    serviceType: 'Telepharmacy',
    alternateName: 'เภสัชกรรมทางไกล',
    audienceType: 'https://schema.org/Patient',
  },
  teleconsultation: {
    serviceType: 'Telemedicine',
    alternateName: 'ปรึกษาแพทย์ออนไลน์',
    audienceType: 'https://schema.org/Patient',
  },
  'health-mall': {
    serviceType: 'Online pharmacy and health products',
    alternateName: 'Health Mall',
  },
  'health-plaza': {
    serviceType: 'Health products and services',
    alternateName: 'Health Plaza',
  },
}

type PageDoc = {
  title: string
  updatedAt: string
  seo?: { metaDescription?: string | null; metaTitle?: string | null } | null
}

export function isServiceLandingSlug(slug: string): slug is ServiceLandingSlug {
  return (SERVICE_LANDING_SLUGS as readonly string[]).includes(slug)
}

export function buildServiceLandingJsonLd(slug: ServiceLandingSlug, page: PageDoc) {
  const meta = SERVICE_META[slug]
  const url = `${SITE_URL}/${slug}`
  const description = page.seo?.metaDescription ?? undefined

  const service: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: page.seo?.metaTitle ?? page.title,
    alternateName: meta.alternateName,
    serviceType: meta.serviceType,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: 'BeDee',
      url: SITE_URL,
      parentOrganization: { '@type': 'Organization', name: 'BDMS' },
    },
    areaServed: { '@type': 'Country', name: 'Thailand' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: url,
      availableLanguage: { '@type': 'Language', name: 'Thai' },
    },
  }

  if (meta.audienceType) {
    service.audience = { '@type': 'PeopleAudience', audienceType: meta.audienceType }
  }

  if (slug === 'telepharmacy') {
    service.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'THB',
      description: 'ปรึกษาเภสัชกรฟรีตามเงื่อนไขบริการในแอป BeDee',
      url,
    }
  }

  return service
}

export function buildServiceLandingBreadcrumbJsonLd(slug: ServiceLandingSlug, pageTitle: string) {
  const url = `${SITE_URL}/${slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: pageTitle, item: url },
    ],
  }
}

export function enrichWebPageForServiceLanding(
  webPage: Record<string, unknown>,
  slug: ServiceLandingSlug,
): Record<string, unknown> {
  const url = `${SITE_URL}/${slug}`
  return {
    ...webPage,
    '@id': `${url}#webpage`,
    isPartOf: { '@type': 'WebSite', name: 'BeDee', url: SITE_URL },
    about: { '@id': `${url}#service` },
    mainEntity: { '@id': `${url}#service` },
  }
}
