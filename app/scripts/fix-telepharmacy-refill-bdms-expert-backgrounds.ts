import { getPayload } from 'payload'
import config from '../src/payload.config'

const MED_REFILL_HEADING = 'ยาใกล้หมด เติมยาโรคประจำตัวออนไลน์ พร้อมปรึกษาเภสัชกรฟรี'
const MED_REFILL_HEADING_LEGACY = 'ยาใกล้หมด ไม่ต้องให้ทุกเดือน กลายเป็นเรื่องยุ่ง'
const BDMS_MARKER = 'ปรึกษาเภสัชกรคุณภาพจาก BDMS'

function isMedRefillBlock(block: { blockType?: string; heading?: string | null }) {
  if (block.blockType !== 'trustChecklist') return false
  return block.heading === MED_REFILL_HEADING || block.heading === MED_REFILL_HEADING_LEGACY
}

function isBdmsIntroBlock(block: { blockType?: string; content?: unknown }) {
  if (block.blockType !== 'richTextContent') return false
  return JSON.stringify(block.content ?? {}).includes(BDMS_MARKER)
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const medRefill = layout.find(isMedRefillBlock)
if (!medRefill) throw new Error('medication refill trustChecklist not found — aborting')

const bdmsIntro = layout.find(isBdmsIntroBlock)
if (!bdmsIntro) throw new Error(`BDMS intro richTextContent not found (marker: ${BDMS_MARKER}) — aborting`)

const expertTabs = layout.find((b) => b.blockType === 'expertTabs')
if (!expertTabs) throw new Error('expertTabs block not found — aborting')

let updated = 0

if (medRefill.backgroundVariant !== 'plain') {
  medRefill.backgroundVariant = 'plain'
  updated++
}
if (bdmsIntro.variant !== 'plain') {
  bdmsIntro.variant = 'plain'
  updated++
}
if (expertTabs.backgroundVariant !== 'lightBlue') {
  expertTabs.backgroundVariant = 'lightBlue'
  updated++
}

if (updated === 0) {
  console.log('med refill / BDMS / expert tabs backgrounds already correct — no changes')
  process.exit(0)
}

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log(`section backgrounds updated (${updated} field(s)): med refill + BDMS white, expert tabs light blue`)
process.exit(0)
