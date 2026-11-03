/**
 * Legacy legal URLs (mobile app + old WordPress) → Payload page slugs.
 *
 * Mobile app constants (path only; host is whatever serves this Next app):
 *   TERM_CONDITION_EN  → /en/terms-and-conditions_en
 *   TERM_CONDITION_TH  → /terms-and-conditions-th  (canonical; no redirect)
 *   PRIVACY_POLICY_EN  → /en/privacypolicy_en
 *   PRIVACY_POLICY_TH  → /privacy-policy-th        (canonical; no redirect)
 */
export const legalPageRedirects = [
  {
    source: '/en/terms-and-conditions_en',
    destination: '/terms-and-conditions-en',
    permanent: true,
  },
  {
    source: '/en/terms-and-conditions-en',
    destination: '/terms-and-conditions-en',
    permanent: true,
  },
  {
    source: '/en/privacypolicy_en',
    destination: '/privacy-policy-en',
    permanent: true,
  },
  {
    source: '/en/privacy-policy-en',
    destination: '/privacy-policy-en',
    permanent: true,
  },
  {
    source: '/privacy-policy',
    destination: '/privacy-policy-th',
    permanent: true,
  },
]
