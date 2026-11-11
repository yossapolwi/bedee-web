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
  // Old WordPress URLs must keep working after migration.
  async redirects() {
    return [
      {
        source: '/articles/:category/:slug',
        destination: '/article/:category/:slug',
        permanent: true,
      },
      {
        source: '/news-and-activities/page/:page',
        destination: '/news-activities?page=:page',
        permanent: true,
      },
      {
        source: '/news-and-activities',
        destination: '/news-activities',
        permanent: true,
      },
      {
        source: '/news-and-activities/:slug',
        destination: '/news-activities/:slug',
        permanent: true,
      },
      ...legalPageRedirects,
    ]
  },
}

export default withPayload(nextConfig)
