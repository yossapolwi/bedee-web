import { getPayload } from 'payload'
import config from '../src/payload.config'

const STEPS_MARKER = 'ขั้นตอนปรึกษาเภสัชกรออนไลน์'
const NEW_HEADING = 'บริการให้คำแนะนำสั่งยาตามอาการ ออนไลน์ ทุกที่ ทุกเวลา'
const NEW_BODY =
  'บริการทั้งยาสามัญประจำบ้าน ยาที่จำหน่ายในร้านยาโดยเภสัชกร ยาตามใบสั่งแพทย์ วิตามิน และผลิตภัณฑ์เสริมอาหาร โดยเภสัชกรที่มีความน่าเชื่อถือ ให้คำปรึกษาฟรี จะพิจารณาความเหมาะสมก่อนจัดยา และโปรโมชันมากมาย แพลตฟอร์มและแอปพลิเคชันร้านขายยาออนไลน์'

function isStepsIntroBlock(block: { blockType?: string; heading?: string | null; content?: unknown }) {
  if (block.blockType !== 'richTextContent') return false
  const hay = `${block.heading ?? ''}${JSON.stringify(block.content ?? {})}`
  return hay.includes(STEPS_MARKER)
}

function isMedicineProductsBlock(block: { blockType?: string; kicker?: string | null; heading?: string | null }) {
  if (block.blockType !== 'trustChecklist') return false
  if (block.kicker === 'MEDICINE & HEALTH PRODUCTS') return true
  return block.heading === 'ยาคุณภาพ ครอบคลุมความต้องการด้านสุขภาพ' || block.heading === NEW_HEADING
}

function stepsSectionEndIndex(layout: any[]) {
  const stepsIndex = layout.findIndex(isStepsIntroBlock)
  if (stepsIndex === -1) throw new Error(`steps section not found (marker: ${STEPS_MARKER}) — aborting`)
  if (layout[stepsIndex + 1]?.blockType === 'imageCarousel') return stepsIndex + 1
  return stepsIndex
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const medIndex = layout.findIndex(isMedicineProductsBlock)
if (medIndex === -1) throw new Error('medicine products trustChecklist block not found — aborting')

const medicineBlock = layout[medIndex]
medicineBlock.kicker = null
medicineBlock.heading = NEW_HEADING
medicineBlock.body = NEW_BODY

const insertAfter = stepsSectionEndIndex(layout)
let newLayout = layout

if (medIndex !== insertAfter + 1) {
  newLayout = layout.filter((b) => b !== medicineBlock)
  const newInsertAfter = stepsSectionEndIndex(newLayout)
  newLayout.splice(newInsertAfter + 1, 0, medicineBlock)
}

await payload.update({ collection: 'pages', id: page.id, data: { layout: newLayout }, overrideAccess: true })
console.log(
  medIndex === insertAfter + 1
    ? 'medicine products copy updated; position already after steps section'
    : `medicine products updated and moved to index ${newLayout.indexOf(medicineBlock)} after steps section`,
)
process.exit(0)
