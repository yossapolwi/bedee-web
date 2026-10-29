import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  mediaFilenameFromUrl,
  scrapeShopBedeeProduct,
  type ScrapedShopProduct,
} from './lib/scrapeShopBedeeProduct'

const SHOP_SKUS = [
  'PP0000000017',
  'PP0000000054',
  'PP0000000058',
  'PP0000000064',
  'PP0000000068',
]

function ensurePayloadEnv() {
  if (!process.env.DATABASE_URI && process.env.SUPABASE_DB_PASSWORD) {
    const linkedPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../supabase/.temp/linked-project.json',
    )
    const ref = existsSync(linkedPath)
      ? (JSON.parse(readFileSync(linkedPath, 'utf8')) as { ref: string }).ref
      : 'ohnrtwjchdlhxmawzzfr'
    const password = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)
    process.env.DATABASE_URI = `postgresql://postgres.${ref}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
  }

  if (!process.env.DATABASE_URI) {
    throw new Error(
      'Missing DATABASE_URI. Create app/.env (see ENV_SETUP.md) or set SUPABASE_DB_PASSWORD with a linked Supabase project.',
    )
  }
  if (process.env.DATABASE_URI.includes('[YOUR-DB-PASSWORD]')) {
    throw new Error('DATABASE_URI still contains the [YOUR-DB-PASSWORD] placeholder — set the real DB password.')
  }
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('Missing PAYLOAD_SECRET in app/.env (same value as production/Vercel).')
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN in app/.env (Vercel Blob — required to upload product images).')
  }
}

ensurePayloadEnv()
const payload = await getPayload({ config })

function imageMimeFromUrl(url: string, headerType?: string | null): string {
  const header = headerType?.split(';')[0]?.trim()
  if (header && header !== 'application/octet-stream' && header.startsWith('image/')) {
    return header
  }
  const ext = path.extname(new URL(url).pathname).toLowerCase()
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    default:
      return 'image/jpeg'
  }
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'BeDee-Payload/1.0' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  const data = Buffer.from(await response.arrayBuffer())
  const originalName = path.basename(decodeURIComponent(new URL(url).pathname)) || 'image.jpg'
  const mimetype = imageMimeFromUrl(url, response.headers.get('content-type'))
  return { data, mimetype, name: originalName, size: data.length }
}

async function uploadFromUrl(url: string, alt: string, prefix: string) {
  const filenameGuess = mediaFilenameFromUrl(url, prefix)
  const existing = (
    await payload.find({ collection: 'media', where: { filename: { equals: filenameGuess } }, limit: 1 })
  ).docs[0]
  if (existing) return existing

  const file = await downloadImage(url)
  return payload.create({
    collection: 'media',
    data: { alt },
    file: { ...file, name: filenameGuess },
    overrideAccess: true,
  })
}

function slugFromSku(sku: string): string {
  return sku.toLowerCase()
}

async function createProductFromShop(scraped: ScrapedShopProduct) {
  const mainImage = await uploadFromUrl(scraped.thumbnailUrl, scraped.title, 'hm-shop')
  const galleryMedia = []
  for (const url of scraped.galleryUrls) {
    try {
      galleryMedia.push(await uploadFromUrl(url, scraped.title, 'hm-shop-g'))
    } catch (err) {
      console.warn('gallery image failed', url, err)
    }
  }

  return payload.create({
    collection: 'products',
    data: {
      title: scraped.title,
      slug: slugFromSku(scraped.sku),
      image: mainImage.id,
      gallery: galleryMedia.map((m) => ({ image: m.id })),
      shortDescription: scraped.shortDescription || undefined,
      description: scraped.description || undefined,
      highlights: scraped.highlights.map((text) => ({ text })),
      usage: scraped.usage.map((text) => ({ text })),
      price: scraped.price,
      originalPrice: scraped.originalPrice,
      externalUrl: scraped.externalUrl,
    },
    overrideAccess: true,
  })
}

function productIdsFromBlock(block: Record<string, unknown>): number[] {
  return ((block.products as unknown[]) ?? []).map((p) =>
    typeof p === 'object' && p && 'id' in p ? (p as { id: number }).id : (p as number),
  )
}

const healthMallPage = (
  await payload.find({ collection: 'pages', where: { slug: { equals: 'health-mall' } }, limit: 1 })
).docs[0]
if (!healthMallPage) throw new Error('health-mall page not found')

const layout = [...((healthMallPage.layout ?? []) as Record<string, unknown>[])]

let carouselIndex = layout.findIndex((b) => b.blockType === 'productCarousel')
if (carouselIndex === -1) {
  const articleIdx = layout.findIndex((b) => b.blockType === 'articleGrid')
  const insertAt = articleIdx === -1 ? layout.length : articleIdx
  layout.splice(insertAt, 0, {
    blockType: 'productCarousel',
    heading: 'สินค้าสุขภาพ',
    products: [],
  })
  carouselIndex = insertAt
  console.log('Inserted missing productCarousel block on health-mall page')
}

const oldCarouselIds = productIdsFromBlock(layout[carouselIndex])

// Collect product IDs still referenced elsewhere (e.g. health-plaza packages).
const otherPages = await payload.find({ collection: 'pages', where: { slug: { not_equals: 'health-mall' } }, limit: 200, depth: 0 })
const idsUsedElsewhere = new Set<number>()
for (const page of otherPages.docs) {
  for (const block of (page.layout ?? []) as Record<string, unknown>[]) {
    if (block.blockType !== 'productCarousel') continue
    for (const id of productIdsFromBlock(block)) idsUsedElsewhere.add(id)
  }
}

const scrapedProducts: ScrapedShopProduct[] = []
for (const sku of SHOP_SKUS) {
  console.log('Scraping', sku, '…')
  scrapedProducts.push(await scrapeShopBedeeProduct(sku))
}

const newProductDocs = []
for (const scraped of scrapedProducts) {
  const doc = await createProductFromShop(scraped)
  newProductDocs.push(doc)
  console.log('Created product', doc.id, scraped.title)
}

const carousel = layout[carouselIndex] as Record<string, unknown>
const newLayout = [...layout]
newLayout[carouselIndex] = {
  ...carousel,
  products: newProductDocs.map((d) => d.id),
}

await payload.update({
  collection: 'pages',
  id: healthMallPage.id,
  data: { layout: newLayout },
  overrideAccess: true,
})

for (const id of oldCarouselIds) {
  if (idsUsedElsewhere.has(id)) {
    console.log('Keeping product', id, '(still used on another page)')
    continue
  }
  await payload.delete({ collection: 'products', id, overrideAccess: true })
  console.log('Deleted old health-mall product', id)
}

console.log('Done — health-mall carousel now has', newProductDocs.length, 'products')
process.exit(0)
