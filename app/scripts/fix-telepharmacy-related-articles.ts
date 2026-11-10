import { getPayload } from 'payload'
import config from '../src/payload.config'

const HEADING = 'บทความที่เกี่ยวข้อง'
const POST_SLUGS = ['antihypertensives', 'lipid-lowering-drugs', 'diabetes-medications'] as const

const payload = await getPayload({ config })

const postIds: number[] = []
for (const slug of POST_SLUGS) {
  const doc = (
    await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  ).docs[0]
  if (!doc) throw new Error(`post not found: ${slug} (expected /article/pharmacy/${slug}) — aborting`)
  postIds.push(doc.id)
}

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]
const articleGrid = layout.find((b) => b.blockType === 'articleGrid')
if (!articleGrid) throw new Error('articleGrid block not found — aborting')

const currentIds = (articleGrid.posts ?? []).map((p: { id?: number } | number) =>
  typeof p === 'object' && p ? p.id : p,
)

const already =
  articleGrid.heading === HEADING &&
  currentIds.length === postIds.length &&
  postIds.every((id, i) => currentIds[i] === id)

if (already) {
  console.log('telepharmacy related articles already pinned — no changes')
  process.exit(0)
}

articleGrid.heading = HEADING
articleGrid.posts = postIds
articleGrid.postCount = postIds.length
articleGrid.categorySlug = null

await payload.update({ collection: 'pages', id: page.id, data: { layout }, overrideAccess: true })
console.log(`pinned related articles: ${POST_SLUGS.join(', ')}`)
process.exit(0)
