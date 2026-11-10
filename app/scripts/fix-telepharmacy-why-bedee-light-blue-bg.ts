import { getPayload } from 'payload'
import config from '../src/payload.config'

const WHY_HEADING = 'ทำไมต้องใช้แอปให้คำแนะนำสั่งยาออนไลน์โดยเภสัชจาก BeDee'

function isWhyBedeeBlock(block: { blockType?: string; heading?: string | null; items?: Array<{ title?: string }> }) {
  if (block.blockType !== 'featureSteps') return false
  if (block.heading === WHY_HEADING) return true
  const titles = (block.items ?? []).map((i) => i.title)
  return titles.includes('สะดวกและรวดเร็ว') && titles.includes('ดูแลครบในที่เดียว')
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const block = layout.find(isWhyBedeeBlock)
if (!block) throw new Error('why BeDee featureSteps block not found — aborting')

if (block.variant === 'tinted') {
  console.log('why BeDee featureSteps already light blue — no changes')
  process.exit(0)
}

block.variant = 'tinted'

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log('why BeDee featureSteps background set to light blue')
process.exit(0)
