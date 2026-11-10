import { getPayload } from 'payload'
import config from '../src/payload.config'

const DEFINITION_MARKER =
  'เภสัชกรรมทางไกล (Telepharmacy) คือบริการให้คำปรึกษาและจ่ายยาโดยเภสัชกรผ่านช่องทางออนไลน์'

function hasTelepharmacyDefinition(block: { blockType?: string; content?: unknown }) {
  if (block.blockType !== 'richTextContent') return false
  return JSON.stringify(block.content ?? '').includes(DEFINITION_MARKER)
}

// Trust strip added with slide 3 / SEO redesign — paired under the definition blurb.
function isHeroTrustBarIconGrid(block: { blockType?: string; items?: Array<{ label?: string }> }) {
  if (block.blockType !== 'iconGrid') return false
  const labels = (block.items ?? []).map((i) => i.label)
  return (
    labels.includes('มาตรฐาน BDMS') &&
    labels.includes('เข้าถึงง่าย') &&
    labels.includes('ส่งด่วน 90 นาที*') &&
    labels.includes('ข้อมูลเป็นส่วนตัว')
  )
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const removed: string[] = []

const newLayout = layout.filter((block) => {
  if (hasTelepharmacyDefinition(block)) {
    removed.push('richTextContent (Telepharmacy definition)')
    return false
  }
  if (isHeroTrustBarIconGrid(block)) {
    removed.push('iconGrid (hero trust bar)')
    return false
  }
  return true
})

if (removed.length === 0) {
  console.log('No Telepharmacy definition or hero trust bar found — no changes')
  process.exit(0)
}

if (newLayout.length === layout.length) {
  throw new Error('filter did not remove blocks — aborting')
}

await payload.update({ collection: 'pages', id: page.id, data: { layout: newLayout }, overrideAccess: true })
console.log(`Removed: ${removed.join(', ')}`)
process.exit(0)
