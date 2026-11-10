import { getPayload } from 'payload'
import config from '../src/payload.config'

const HEADING_MARKER = 'ซื้อยาออนไลน์ ปลอดภัย มั่นใจ'
const LINKED = '[สภาเภสัชกรรม](https://www.pharmacycouncil.org/)'
const PLAIN = 'สภาเภสัชกรรม'

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const block = layout.find(
  (b) => b.blockType === 'credentialStrip' && typeof b.heading === 'string' && b.heading.includes(HEADING_MARKER),
)
if (!block) throw new Error(`credentialStrip not found (heading contains: ${HEADING_MARKER}) — aborting`)

const body = typeof block.body === 'string' ? block.body : ''
if (!body.includes(PLAIN)) {
  throw new Error('subtitle does not contain สภาเภสัชกรรม — aborting')
}
if (body.includes(LINKED)) {
  console.log('pharmacy council link already present in subtitle — no changes')
  process.exit(0)
}

block.body = body.replace(PLAIN, LINKED)

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log('linked สภาเภสัชกรรม to https://www.pharmacycouncil.org/ in credential strip subtitle')
process.exit(0)
