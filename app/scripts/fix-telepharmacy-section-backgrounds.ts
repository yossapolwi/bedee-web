import { getPayload } from 'payload'
import config from '../src/payload.config'

const STEPS_MARKER = 'ขั้นตอนปรึกษาเภสัชกรออนไลน์'
const MEDICINE_HEADING = 'บริการให้คำแนะนำสั่งยาตามอาการ ออนไลน์ ทุกที่ ทุกเวลา'

function isStepsIntroBlock(block: { blockType?: string; heading?: string | null; content?: unknown }) {
  if (block.blockType !== 'richTextContent') return false
  const hay = `${block.heading ?? ''}${JSON.stringify(block.content ?? {})}`
  return hay.includes(STEPS_MARKER)
}

function isMedicineProductsBlock(block: { blockType?: string; heading?: string | null }) {
  if (block.blockType !== 'trustChecklist') return false
  return block.heading === MEDICINE_HEADING || block.heading === 'ยาคุณภาพ ครอบคลุมความต้องการด้านสุขภาพ'
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
let updated = 0

const hasSteps = layout.some(isStepsIntroBlock)
const hasMedicine = layout.some(isMedicineProductsBlock)
if (!hasSteps && !hasMedicine) throw new Error('steps or medicine blocks not found — aborting')

for (const block of layout) {
  if (isStepsIntroBlock(block)) {
    if (block.variant !== 'plain') {
      block.variant = 'plain'
      updated++
    }
  }
  if (block.blockType === 'imageCarousel') {
    const idx = layout.indexOf(block)
    const prev = layout[idx - 1]
    if (prev && isStepsIntroBlock(prev) && block.variant !== 'plain') {
      block.variant = 'plain'
      updated++
    }
  }
  if (isMedicineProductsBlock(block) && block.backgroundVariant !== 'lightBlue') {
    block.backgroundVariant = 'lightBlue'
    updated++
  }
}

if (updated === 0) {
  console.log('steps white, medicine light blue — already set')
  process.exit(0)
}

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log(`section backgrounds updated (${updated} block field(s))`)
process.exit(0)
