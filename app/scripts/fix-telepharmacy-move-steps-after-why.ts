import { getPayload } from 'payload'
import config from '../src/payload.config'

const WHY_HEADING = 'ทำไมต้องใช้แอปให้คำแนะนำสั่งยาออนไลน์โดยเภสัชจาก BeDee'
const STEPS_MARKER = 'ขั้นตอนปรึกษาเภสัชกรออนไลน์'

function isWhyBedeeBlock(block: { blockType?: string; heading?: string; items?: Array<{ title?: string }> }) {
  if (block.blockType !== 'featureSteps') return false
  if (block.heading === WHY_HEADING) return true
  const titles = (block.items ?? []).map((i) => i.title)
  return titles.includes('สะดวกและรวดเร็ว') && titles.includes('ดูแลครบในที่เดียว')
}

function isStepsIntroBlock(block: { blockType?: string; heading?: string | null; content?: unknown }) {
  if (block.blockType !== 'richTextContent') return false
  const hay = `${block.heading ?? ''}${JSON.stringify(block.content ?? {})}`
  return hay.includes(STEPS_MARKER)
}

const payload = await getPayload({ config })

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'telepharmacy' } }, limit: 1 })).docs[0]
if (!page) throw new Error('telepharmacy page not found — aborting')

const layout = page.layout as any[]

const whyIndex = layout.findIndex(isWhyBedeeBlock)
if (whyIndex === -1) throw new Error('why BeDee featureSteps not found — aborting')

const stepsIndex = layout.findIndex(isStepsIntroBlock)
if (stepsIndex === -1) throw new Error(`steps richText block not found (marker: ${STEPS_MARKER}) — aborting`)

const sectionBlocks: any[] = [layout[stepsIndex]]
const afterSteps = layout[stepsIndex + 1]
if (afterSteps?.blockType === 'imageCarousel') {
  sectionBlocks.push(afterSteps)
}

if (whyIndex + 1 < layout.length && sectionBlocks.every((b, i) => layout[whyIndex + 1 + i] === b)) {
  console.log('steps section already directly after why BeDee — no changes')
  process.exit(0)
}

const withoutSection = layout.filter((b) => !sectionBlocks.includes(b))
const newWhyIndex = withoutSection.findIndex(isWhyBedeeBlock)
withoutSection.splice(newWhyIndex + 1, 0, ...sectionBlocks)

await payload.update({ collection: 'pages', id: page.id, data: { layout: withoutSection }, overrideAccess: true })
console.log(
  `moved steps section (${sectionBlocks.map((b) => b.blockType).join(' + ')}) to index ${newWhyIndex + 1} after why BeDee`,
)
process.exit(0)
