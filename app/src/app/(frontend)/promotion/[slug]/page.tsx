import { cache } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { promotionLinkOpensInNewTab } from '@/lib/promotionUrl'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

const getPromotion = cache(async (rawSlug: string) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'promotions',
    where: { slug: { equals: decodeURIComponent(rawSlug) } },
    depth: 1,
    limit: 1,
    draft,
  })
  return result.docs[0] ?? null
})

function formatPromoDate(value: string | null | undefined): string | null {
  if (!value) return null
  return new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const promo = await getPromotion(slug)
  if (!promo) return {}

  const banner = typeof promo.banner === 'object' ? promo.banner : null
  const path = `/promotion/${promo.slug}`

  return {
    title: promo.title,
    alternates: { canonical: path },
    openGraph: {
      title: promo.title,
      type: 'website',
      url: path,
      images: banner?.url ? [{ url: banner.url, alt: banner.alt ?? promo.title }] : undefined,
    },
    twitter: {
      card: banner?.url ? 'summary_large_image' : 'summary',
      title: promo.title,
      images: banner?.url ? [banner.url] : undefined,
    },
  }
}

export default async function PromotionDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const promo = await getPromotion(slug)
  const { isEnabled: draft } = await draftMode()

  if (!promo) notFound()

  const banner = typeof promo.banner === 'object' ? promo.banner : null
  const path = `/promotion/${promo.slug}`
  const validFrom = formatPromoDate(promo.validFrom)
  const validUntil = formatPromoDate(promo.validUntil)
  const validity =
    validFrom && validUntil
      ? `โปรโมชัน ${validFrom} – ${validUntil}`
      : validUntil
        ? `โปรโมชันถึง ${validUntil}`
        : validFrom
          ? `เริ่ม ${validFrom}`
          : null

  const externalCta =
    promo.ctaUrl && promotionLinkOpensInNewTab(promo.ctaUrl) ? promo.ctaUrl : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'โปรโมชันล่าสุด', item: '/promotions' },
      { '@type': 'ListItem', position: 3, name: promo.title, item: path },
    ],
  }

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: promo.title,
    url: path,
    dateModified: promo.updatedAt,
    publisher: { '@type': 'Organization', name: 'BeDee' },
  }

  return (
    <>
      {draft && <LivePreviewListener />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-semibold leading-tight text-primary">{promo.title}</h1>
        {validity ? <p className="mt-3 text-sm text-muted">{validity}</p> : null}
        {banner?.url ? (
          <div className="relative mt-8 aspect-[1024/584] w-full overflow-hidden bg-gray-100">
            <Image
              src={banner.url}
              alt={banner.alt || promo.title}
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        {promo.description ? (
          <RichText
            className="mt-8 space-y-5 leading-8 text-[#222] [&_a]:text-[#317DF5] [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#081F7C] [&_h3]:pt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-6 [&_li]:list-disc"
            data={promo.description}
          />
        ) : null}
        {externalCta ? (
          <p className="mt-10">
            <a
              href={externalCta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-pill bg-secondary px-6 py-3 font-semibold text-white"
            >
              ดูรายละเอียดเพิ่มเติม
            </a>
          </p>
        ) : null}
      </main>
      <SiteFooter />
    </>
  )
}
