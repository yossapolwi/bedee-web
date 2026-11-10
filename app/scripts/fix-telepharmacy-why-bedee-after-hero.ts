import { getPayload } from 'payload'
import config from '../src/payload.config'

const HEADING = 'ทำไมต้องใช้แอปให้คำแนะนำสั่งยาออนไลน์โดยเภสัชจาก BeDee'
const DESCRIPTION =
  'BeDee by BDMS ให้บริการเภสัชกรรมทางไกล (Telepharmacy) ผ่านแอปพลิเคชัน เชื่อมคุณกับเภสัชกรเพื่อประเมินความเหมาะสมก่อนจ่ายยา พร้อมแนะนำวิธีใช้และจัดส่งถึงบ้าน เหมาะสำหรับผู้ที่ต้องการสั่งยาออนไลน์โดยมีผู้เชี่ยวชาญให้คำปรึกษา'
const ICON_BY_TITLE: Record<string, string> = {
  'สะดวกและรวดเร็ว': 'icon-tp-fast-delivery.png',
  'รับยาได้หลายรูปแบบ': 'icon-tp-submit-info.png',
  'เภสัชกรให้คำปรึกษา': 'icon-tp-pharmacist-review.png',
  'ผลิตภัณฑ์หลากหลาย': 'icon-tp-med-complete.png',
  'บริการอย่างมีมาตรฐาน': 'icon-tp-privacy.png',
  'ดูแลครบในที่เดียว': 'icon-tp-easy-access.png',
}

const ITEMS = [
  {
    title: 'สะดวกและรวดเร็ว',
    description:
      'พูดคุยผ่านวิดีโอคอลหรือแชทโดยปรึกษา รับคำแนะนำเรื่องยา วิธีใช้ และข้อควรระวังตามข้อมูลสุขภาพของคุณ โดยตรวจสอบเวลาให้บริการล่าสุดได้ในแอป',
  },
  {
    title: 'รับยาได้หลายรูปแบบ',
    description:
      'ส่งด่วน ส่งมาตรฐาน หรือเลือกรับที่ร้านยาพาร์ทเนอร์ที่ร่วมรายการ รองรับการชำระเงินหลายรูปแบบ',
  },
  {
    title: 'เภสัชกรให้คำปรึกษา',
    description:
      'เภสัชกรแนะนำวิธีใช้ยา ข้อควรระวัง และตอบคำถามตามข้อมูลสุขภาพของแต่ละคนให้คำปรึกษาตั้งแต่เวลา 08.00 - 21.00 น.',
  },
  {
    title: 'ผลิตภัณฑ์หลากหลาย',
    description:
      'มีทั้งยา วิตามิน ผลิตภัณฑ์เสริมอาหาร และอุปกรณ์ดูแลสุขภาพ พร้อมเภสัชกรช่วยแนะนำให้เหมาะกับความต้องการของแต่ละคน',
  },
  {
    title: 'บริการอย่างมีมาตรฐาน',
    description:
      'ยาได้รับการจัดจากร้านยาที่ผ่านการคัดกรอง พร้อมกระบวนการที่ตรวจสอบได้ รับรองจากสำนักงานคณะกรรมการอาหารและยา (อย.)',
  },
  {
    title: 'ดูแลครบในที่เดียว',
    description:
      'ปรึกษา สั่งซื้อ ชำระเงิน ติดตามการจัดส่ง และดูประวัติสุขภาพในแพลตฟอร์มเดียว',
  },
]

async function mediaId(payload: Awaited<ReturnType<typeof getPayload>>, filename: string) {
  const doc = (await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })).docs[0]
  if (!doc) throw new Error(`media not found: ${filename}`)
  return doc.id
}

function isWhyBedeeBlock(block: { blockType?: string; kicker?: string; items?: Array<{ title?: string }> }) {
  if (block.blockType !== 'featureSteps') return false
  if (block.kicker === 'WHY BEDEE TELEPHARMACY') return true
  const titles = (block.items ?? []).map((i) => i.title)
  return titles.includes('สะดวกและรวดเร็ว') && titles.includes('ดูแลครบในที่เดียว')
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

let layout = page.layout as any[]
const heroIndex = layout.findIndex((b) => b.blockType === 'heroCarousel')
if (heroIndex === -1) throw new Error('heroCarousel not found — aborting')

if (layout.findIndex(isWhyBedeeBlock) === -1) {
  throw new Error('featureSteps (why BeDee) block not found — aborting')
}

layout = layout.filter((b) => b.blockType !== 'introCta')

const resolvedWhyIndex = layout.findIndex(isWhyBedeeBlock)
const block = layout[resolvedWhyIndex]

const iconIds = Object.fromEntries(
  await Promise.all(
    Object.entries(ICON_BY_TITLE).map(async ([title, file]) => [title, await mediaId(payload, file)]),
  ),
)

block.variant = 'tinted'
block.kicker = null
block.heading = HEADING
block.description = DESCRIPTION
block.ctaLabel = null
block.ctaUrl = null
block.items = ITEMS.map((item) => ({
  ...item,
  icon: iconIds[item.title],
}))

layout.splice(resolvedWhyIndex, 1)
const heroAfterFilter = layout.findIndex((b) => b.blockType === 'heroCarousel')
layout.splice(heroAfterFilter + 1, 0, block)

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log('why BeDee featureSteps updated and moved directly after hero; introCta removed if present')
process.exit(0)
