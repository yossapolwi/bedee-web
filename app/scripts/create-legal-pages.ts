import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { parseLegalHtmlFile } from './lib/htmlToLexicalLegal'

const payload = await getPayload({ config })

type LegalPageSpec = {
  slug: string
  sourceUrl: string
  htmlFile: string
  title?: string
  heading?: string
  metaDescription: string
}

const pages: LegalPageSpec[] = [
  {
    slug: 'privacy-policy-en',
    sourceUrl: 'https://www.bedee.com/en/privacypolicy_en',
    htmlFile: 'privacy_policy_en.html',
    heading: 'Privacy Policy',
    metaDescription: 'Privacy Notice',
  },
  {
    slug: 'terms-and-conditions-th',
    sourceUrl: 'https://www.bedee.com/terms-and-conditions-th',
    htmlFile: 'terms_and_conditions_th.html',
    title: 'ข้อกำหนดและเงื่อนไข',
    heading: 'ข้อกำหนดและเงื่อนไข',
    metaDescription: 'ข้อกำหนดและเงื่อนไขการใช้งานแพลตฟอร์ม BeDee',
  },
  {
    slug: 'terms-and-conditions-en',
    sourceUrl: 'https://www.bedee.com/en/terms-and-conditions_en',
    htmlFile: 'terms_and_conditions_en.html',
    title: 'Terms and Conditions',
    heading: 'Terms and Conditions',
    metaDescription: 'BeDee platform terms of use',
  },
]

for (const spec of pages) {
  const parsed = parseLegalHtmlFile(spec.htmlFile, spec.sourceUrl)
  const pageTitle = spec.title ?? parsed.title
  const heading = spec.heading ?? pageTitle
  const data = {
    title: pageTitle,
    slug: spec.slug,
    sourceUrl: spec.sourceUrl,
    layout: [
      {
        blockType: 'richTextContent' as const,
        heading,
        content: parsed.content,
      },
    ],
    seo: {
      metaTitle: `${pageTitle} - BeDee`,
      metaDescription: spec.metaDescription,
    },
    _status: 'published' as const,
  }

  const existing = (
    await payload.find({
      collection: 'pages',
      where: { slug: { equals: spec.slug } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]

  if (existing) {
    await payload.update({ collection: 'pages', id: existing.id, data, locale: 'th', overrideAccess: true })
    console.log('updated', spec.slug, existing.id, `(${parsed.content.root.children.length} blocks)`)
  } else {
    const created = await payload.create({ collection: 'pages', data, locale: 'th', overrideAccess: true })
    console.log('created', spec.slug, created.id, `(${parsed.content.root.children.length} blocks)`)
  }
}

const footer = await payload.findGlobal({ slug: 'footer', locale: 'th', overrideAccess: true, depth: 0 })
const linkGroups = (footer.linkGroups ?? []) as Array<{
  heading?: string | null
  links?: Array<{ label?: string | null; url?: string | null }> | null
}>

const urlReplacements: Record<string, string> = {
  'https://www.bedee.com/privacy-policy': '/privacy-policy-th',
  'https://www.bedee.com/privacy-policy-th': '/privacy-policy-th',
  '/privacy-policy': '/privacy-policy-th',
  'https://www.bedee.com/terms-and-conditions-th': '/terms-and-conditions-th',
  'https://www.bedee.com/terms-and-conditions': '/terms-and-conditions-th',
  'https://www.bedee.com/en/terms-and-conditions_en': '/terms-and-conditions-en',
  'https://www.bedee.com/en/terms-and-conditions-en': '/terms-and-conditions-en',
  'https://www.bedee.com/en/privacypolicy_en': '/privacy-policy-en',
}

let footerChanged = false
for (const group of linkGroups) {
  for (const link of group.links ?? []) {
    const next = link.url ? urlReplacements[link.url] : undefined
    if (next && link.url !== next) {
      link.url = next
      footerChanged = true
    }
  }
}

const legalGroup = linkGroups.find((g) => g.heading === 'กฏหมาย')
const hasTermsTh = legalGroup?.links?.some((l) => l.url === '/terms-and-conditions-th')

if (legalGroup?.links) {
  const before = legalGroup.links.length
  legalGroup.links = legalGroup.links.filter(
    (l) =>
      l.url !== '/privacy-policy-en' &&
      l.url !== '/terms-and-conditions-en' &&
      l.label !== 'Privacy Policy (EN)' &&
      l.label !== 'Terms and Conditions (EN)',
  )
  if (legalGroup.links.length !== before) footerChanged = true

  if (!hasTermsTh) {
    legalGroup.links.push({ label: 'ข้อกำหนดและเงื่อนไข', url: '/terms-and-conditions-th' })
    footerChanged = true
  }
}

if (footerChanged) {
  await payload.updateGlobal({ slug: 'footer', data: { linkGroups }, locale: 'th', overrideAccess: true })
  console.log('updated footer legal links')
}

await Promise.race([payload.destroy(), new Promise((resolve) => setTimeout(resolve, 2_000))])
process.exit(0)
