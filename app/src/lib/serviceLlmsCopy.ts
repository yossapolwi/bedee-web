import type { ServiceLandingSlug } from '@/lib/serviceLandingSchema'

/** AI-readable bullets — synced with live telepharmacy copy, not a second CMS. */
export const SERVICE_LLMS_BULLETS: Record<ServiceLandingSlug, string[]> = {
  telepharmacy: [
    'ปรึกษาเภสัชกรออนไลน์ฟรีผ่านแอป BeDee by BDMS (เภสัชกรประเมินก่อนจ่ายยา)',
    'เติมยาเดิม สั่งยาตามอาการ ยา OTC และตามใบสั่งแพทย์ตามข้อกำหนด',
    'จัดส่งทั่วประเทศไทย มีบริการส่งด่วนกรุงเทพฯ 90 นาทีตามพื้นที่และเงื่อนไข',
    'มาตรฐาน อย. เครือ BDMS สภาเภสัชกรรม และ ISO 27001 / ISO 27799',
    'บทความที่เกี่ยวข้อง: /article/pharmacy/antihypertensives, /article/pharmacy/lipid-lowering-drugs, /article/pharmacy/diabetes-medications',
  ],
  teleconsultation: [
    'ปรึกษาแพทย์และผู้เชี่ยวชาญออนไลน์ในเครือ BDMS ผ่านแอป BeDee',
    'หลายสาขา ตั้งแต่เวลา 9.00–23.00 น. (ขยายบริการตามประกาศ)',
    'ได้ใบรับรองแพทย์ และส่งต่อการรักษาในโรงพยาบาล BDMS',
  ],
  'health-mall': [
    'ร้านสุขภาพออนไลน์ — ยา วิตามิน อาหารเสริม และอุปกรณ์ดูแลสุขภาพ',
    'ราคาและรายการสินค้า: /pricing.md และ /health-mall',
  ],
  'health-plaza': [
    'ศูนย์รวมบริการและสินค้าสุขภาพจาก BeDee',
  ],
}
