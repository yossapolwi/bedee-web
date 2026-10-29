import { getPayload } from 'payload'
import config from '../src/payload.config'

const PACKAGE_SHOP_URL = 'https://shop.bedee.com/th/package'

/** Header dropdown label (Thai spelling variants seen in source / CMS). */
function isHealthPackageShopNav(label: string | null | undefined): boolean {
  if (!label) return false
  const normalized = label.replace(/\s/g, '')
  return (
    normalized.includes('ช้อปแพ') ||
    normalized.includes('ช็อปแพ') ||
    normalized.includes('แพคเกจสุขภาพ') ||
    normalized.includes('แพ็กสุขภาพ')
  )
}

const payload = await getPayload({ config })

const header = await payload.findGlobal({ slug: 'header' })
const navItems = (header.navItems ?? []) as {
  label?: string | null
  url?: string | null
  children?: { label?: string | null; url?: string | null }[] | null
}[]

let updated = 0
for (const item of navItems) {
  for (const child of item.children ?? []) {
    if (!isHealthPackageShopNav(child.label)) continue
    if (child.url === PACKAGE_SHOP_URL) continue
    console.log('Updating', child.label, 'from', child.url, '→', PACKAGE_SHOP_URL)
    child.url = PACKAGE_SHOP_URL
    updated++
  }
}

if (updated === 0) {
  console.log('No matching header nav link to update (already correct?)')
  process.exit(0)
}

await payload.updateGlobal({ slug: 'header', data: { navItems }, overrideAccess: true })
console.log('done — updated', updated, 'link(s)')
process.exit(0)
