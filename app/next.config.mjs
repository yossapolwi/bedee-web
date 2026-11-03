import { withPayload } from '@payloadcms/next/withPayload'

import { legalPageRedirects } from './legalPageRedirects.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.bedee.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  // Old WordPress article URLs must keep working after migration.
  async redirects() {
    return [
      {
        source: '/articles/:category/:slug',
        destination: '/article/:category/:slug',
        permanent: true,
      },
      ...legalPageRedirects,
    ]
  },
}

export default withPayload(nextConfig)
