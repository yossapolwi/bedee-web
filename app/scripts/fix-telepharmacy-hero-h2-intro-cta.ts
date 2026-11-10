import { getPayload } from 'payload'
import config from '../src/payload.config'

const INTRO_BLOCK = {
  blockType: 'introCta' as const,
  heading: 'ทำไมต้องใช้แอปให้คำแนะนำสั่งยาออนไลน์โดยเภสัชจาก BeDee',
  body: 'BeDee by BDMS ให้บริการเภสัชกรรมทางไกล (Telepharmacy) ผ่านแอปพลิเคชัน เชื่อมคุณกับเภสัชกรเพื่อประเมินความเหมาะสมก่อนจ่ายยา พร้อมแนะนำวิธีใช้และจัดส่งถึงบ้าน เหมาะสำหรับผู้ที่ต้องการสั่งยาออนไลน์โดยมีผู้เชี่ยวชาญให้คำปรึกษา',
  ctaLabel: 'ตรวจสอบสิทธิในแอป',
  ctaUrl: 'https://get.bedee.com/iQMa/c6f0ia4w',
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const heroIndex = layout.findIndex((b) => b.blockType === 'heroCarousel')
if (heroIndex === -1) throw new Error('heroCarousel not found — aborting')

const existing = layout.find(
  (b) => b.blockType === 'introCta' && b.heading === INTRO_BLOCK.heading,
)
if (existing) {
  existing.body = INTRO_BLOCK.body
  existing.ctaLabel = INTRO_BLOCK.ctaLabel
  existing.ctaUrl = INTRO_BLOCK.ctaUrl
  await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
  console.log('H2 introCta block already present — fields refreshed')
  process.exit(0)
}

layout.splice(heroIndex + 1, 0, INTRO_BLOCK)

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log('H2 introCta inserted after hero')
process.exit(0)
