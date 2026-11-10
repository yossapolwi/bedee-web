import { getPayload } from 'payload'
import config from '../src/payload.config'

const HEADINGS = [
  'ยาใกล้หมด เติมยาโรคประจำตัวออนไลน์ พร้อมปรึกษาเภสัชกรฟรี',
  'ยาใกล้หมด ไม่ต้องให้ทุกเดือน กลายเป็นเรื่องยุ่ง',
] as const

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const block = layout.find((b) => b.blockType === 'trustChecklist' && HEADINGS.includes(b.heading))
if (!block) throw new Error(`trustChecklist not found (headings: ${HEADINGS.join(' | ')}) — aborting`)

if (block.imageSide === 'right') {
  console.log('medication refill layout already text-left — no changes')
  process.exit(0)
}

block.imageSide = 'right'

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log('medication refill trustChecklist set to text left, image right')
process.exit(0)
