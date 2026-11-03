import { getPayload } from 'payload'

import config from '../src/payload.config'

const payload = await getPayload({ config })

const footer = await payload.findGlobal({ slug: 'footer', locale: 'th', overrideAccess: true, depth: 0 })
const linkGroups = (footer.linkGroups ?? []) as Array<{
  heading?: string | null
  links?: Array<{ label?: string | null; url?: string | null }> | null
}>

let removed = 0
for (const group of linkGroups) {
  if (!group.links) continue
  const next = group.links.filter((link) => {
    const drop =
      link.url === '/privacy-policy-en' ||
      link.url === '/terms-and-conditions-en' ||
      link.label === 'Privacy Policy (EN)' ||
      link.label === 'Terms and Conditions (EN)'
    if (drop) removed++
    return !drop
  })
  group.links = next
}

await payload.updateGlobal({ slug: 'footer', data: { linkGroups }, locale: 'th', overrideAccess: true })
console.log('removed', removed, 'EN legal footer link(s)')

await Promise.race([payload.destroy(), new Promise((resolve) => setTimeout(resolve, 2_000))])
process.exit(0)
