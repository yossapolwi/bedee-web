import { getPayload } from 'payload'
import config from '../src/payload.config'

const HEADING = 'คำถามที่พบบ่อยเกี่ยวกับการปรึกษาเภสัชกร'

const NEW_ITEMS = [
  {
    question: 'แอปให้คำแนะนำสั่งยาออนไลน์โดยเภสัชกรปลอดภัยไหม?',
    answer:
      'ควรเลือกบริการที่ได้รับอนุญาตและมีเภสัชกรประเมินก่อนจ่ายยา โดย BeDee by BDMS มีเภสัชกรตรวจสอบประวัติแพ้ยาและความเหมาะสมในการใช้ยา เพื่อช่วยลดความเสี่ยงจากการซื้อยาเอง',
  },
  {
    question: 'สั่งยาออนไลน์ต้องใช้ใบสั่งแพทย์ไหม?',
    answer:
      'ขึ้นอยู่กับประเภทของยา บางชนิดไม่ต้องมีใบสั่งแพทย์ เช่น ยาตามอาการเบื้องต้น บางชนิดต้องมีใบสั่งแพทย์ โดยเภสัชกรจะตรวจสอบข้อกำหนดและประเมินความเหมาะสมก่อนจ่ายยา',
  },
  {
    question: 'สั่งยาออนไลน์โดยเภสัชกรใช้เวลานานแค่ไหน?',
    answer:
      'ระยะเวลาขึ้นอยู่กับการประเมินของเภสัชกรและวิธีจัดส่ง โดย BeDee มีบริการส่งด่วน 90 นาทีในกรุงเทพฯ ตามพื้นที่และเงื่อนไขบริการ ควรตรวจสอบก่อนยืนยันสั่งซื้อ',
  },
] as const

const LEGACY_QUESTIONS = [
  'ทำไมยาบางชนิดต้องปรึกษาเภสัชกร?',
  'ยาที่แอป BeDee แพงไหม?',
  'มีบริการจัดส่งที่ใดบ้าง?',
] as const

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const faqBlock = layout.find((b) => b.blockType === 'faq')
if (!faqBlock) throw new Error('faq block not found — aborting')

const currentItems: { question?: string; answer?: string; id?: string }[] = faqBlock.items ?? []
const byQuestion = new Map(currentItems.filter((i) => i.question).map((i) => [i.question, i]))

const legacyItems = LEGACY_QUESTIONS.map((q) => {
  const found = byQuestion.get(q)
  if (!found?.answer) throw new Error(`legacy FAQ missing in CMS: ${q}`)
  return { question: q, answer: found.answer, ...(found.id ? { id: found.id } : {}) }
})

const targetItems = [...NEW_ITEMS.map((i) => ({ question: i.question, answer: i.answer })), ...legacyItems]

const alreadyOrdered =
  targetItems.length === currentItems.length &&
  targetItems.every((item, idx) => currentItems[idx]?.question === item.question)

if (alreadyOrdered) {
  console.log('telepharmacy FAQ already has 6 items in target order — no changes')
  process.exit(0)
}

faqBlock.heading = HEADING
faqBlock.items = targetItems

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log('telepharmacy FAQ updated: 3 new items (1–3), 3 legacy items (4–6)')
process.exit(0)
