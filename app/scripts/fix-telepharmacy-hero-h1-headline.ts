import { getPayload } from 'payload'
import config from '../src/payload.config'

const NEW_HEADLINE = 'BeDee แอปปรึกษาเภสัชกรออนไลน์ฟรี ให้คำแนะนำสั่งยา ถูกต้อง ปลอดภัย'

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const heroCarousel = layout.find((b) => b.blockType === 'heroCarousel')
if (!heroCarousel?.slides?.[0]) throw new Error('heroCarousel slide not found — aborting')

const slide = heroCarousel.slides[0]
if (slide.headline === NEW_HEADLINE) {
  console.log('H1 headline already set — no changes')
  process.exit(0)
}

const previous = slide.headline
slide.headline = NEW_HEADLINE

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log(`H1 updated: ${previous ? `"${previous}"` : '(empty)'} → "${NEW_HEADLINE}"`)
process.exit(0)
