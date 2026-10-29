import { createHash } from 'node:crypto'

export type ScrapedShopProduct = {
  sku: string
  title: string
  price: number
  originalPrice?: number
  shortDescription: string
  description?: string
  highlights: string[]
  usage: string[]
  thumbnailUrl: string
  galleryUrls: string[]
  externalUrl: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&bull;|•/g, '•')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u003c/g, '<')
    .replace(/\u003e/g, '>')
    .replace(/\u0026/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractDescriptionTH(block: string): string {
  const token = '\\"descriptionTH\\":\\"'
  const start = block.indexOf(token)
  if (start === -1) return ''
  const from = start + token.length
  const end = block.indexOf('\\",\\"descriptionEN\\"', from)
  if (end === -1) return ''
  const raw = block.slice(from, end)
  return raw
    .replace(/\\"/g, '"')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u0026/gi, '&')
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\')
}

function bulletsFromSection(text: string): string[] {
  return text
    .split(/•/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseDescriptionSections(descHtml: string): { intro: string; highlights: string[]; usage: string[] } {
  const plain = stripHtml(descHtml)
  const highlightsMatch = plain.match(/คุณสมบัติโดดเด่น\s*(.*?)(?=เหมาะสำหรับ|$)/s)
  const usageMatch = plain.match(/เหมาะสำหรับ\s*:?\s*(.*?)(?=เพิ่มเติม|$)/s)
  const introEnd = plain.indexOf('คุณสมบัติโดดเด่น')
  const intro = (introEnd > 0 ? plain.slice(0, introEnd) : plain.split('คุณสมบัติ')[0] ?? plain).trim()
  return {
    intro,
    highlights: highlightsMatch ? bulletsFromSection(highlightsMatch[1]) : [],
    usage: usageMatch ? bulletsFromSection(usageMatch[1]) : [],
  }
}

function extractS3ProductUrls(block: string): string[] {
  const urls: string[] = []
  const needle = 'th-admin-management-prod.s3.ap-southeast-7.amazonaws.com/products/'
  let from = 0
  while (true) {
    const idx = block.indexOf(needle, from)
    if (idx === -1) break
    const start = block.lastIndexOf('https', idx)
    if (start === -1) {
      from = idx + needle.length
      continue
    }
    let end = start
    while (end < block.length && !/[\s"\\]/.test(block[end])) end++
    const raw = block.slice(start, end).replace(/\\\//g, '/')
    if (/\.(jpg|jpeg|png)$/i.test(raw)) urls.push(raw)
    from = end
  }
  return [...new Set(urls)]
}

export async function scrapeShopBedeeProduct(hpzSku: string): Promise<ScrapedShopProduct> {
  const externalUrl = `https://shop.bedee.com/th/products/${hpzSku}`
  const res = await fetch(externalUrl, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; BeDee-Payload/1.0)', accept: 'text/html' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`${externalUrl} returned HTTP ${res.status}`)
  const html = await res.text()

  const title = html.match(/<title>([^<|]+)/)?.[1]?.trim()
  if (!title) throw new Error(`Could not parse title for ${hpzSku}`)

  const anchor = html.indexOf(`\\"hpzSku\\":\\"${hpzSku}\\"`)
  if (anchor === -1) throw new Error(`Could not find product payload for ${hpzSku}`)
  const block = html.slice(anchor - 6000, anchor + 6000)

  const price = Number(block.match(/\\"price\\":(\d+)/)?.[1])
  const fullPriceRaw =
    block.match(/\\"fullPrice\\":(\d+)/)?.[1] ?? block.match(/\\"originalPrice\\":(\d+)/)?.[1]
  const fullPrice = fullPriceRaw ? Number(fullPriceRaw) : NaN
  if (!Number.isFinite(price)) throw new Error(`Could not parse price for ${hpzSku}`)

  const descHtml = extractDescriptionTH(block)
  const { intro, highlights, usage } = parseDescriptionSections(descHtml)

  const imageUrls = extractS3ProductUrls(block)
  const thumbnailUrl = imageUrls.find((u) => u.includes('/products/thumbnails/'))
  if (!thumbnailUrl) throw new Error(`Could not parse thumbnail for ${hpzSku}`)
  const galleryUrls = imageUrls.filter((u) => u !== thumbnailUrl).slice(0, 4)

  return {
    sku: hpzSku,
    title,
    price,
    originalPrice: Number.isFinite(fullPrice) && fullPrice > price ? fullPrice : undefined,
    shortDescription: intro.slice(0, 500),
    description: intro.length > 500 ? intro : undefined,
    highlights,
    usage,
    thumbnailUrl,
    galleryUrls,
    externalUrl,
  }
}

export function mediaFilenameFromUrl(url: string, prefix: string): string {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 10)
  const base = url.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '-') ?? 'image.jpg'
  return `${prefix}-${hash}-${base}`
}
