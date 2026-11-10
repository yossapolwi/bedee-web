import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const expertTabs = layout.find((b) => b.blockType === 'expertTabs')
if (!expertTabs) throw new Error('expertTabs block not found — aborting')

if (expertTabs.backgroundVariant === 'plain') {
  console.log('telepharmacy expertTabs already white — no changes')
  process.exit(0)
}

expertTabs.backgroundVariant = 'plain'

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log('telepharmacy expertTabs background set to white')
process.exit(0)
