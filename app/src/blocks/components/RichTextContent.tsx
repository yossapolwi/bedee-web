import { RichText } from '@payloadcms/richtext-lexical/react'

const LIGHT_BLUE_BAND = 'bg-gradient-to-br from-[#EAF4FF] to-[#CFE7FF]'

type RichTextContentProps = {
  heading?: string | null
  variant?: 'plain' | 'tinted' | null
  // Payload's generated rich-text node union is intentionally open to editor features.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
}

export function RichTextContent({ heading, content, variant = 'plain' }: RichTextContentProps) {
  const inner = (
    <div className="mx-auto max-w-5xl px-6">
      {heading ? <h1 className="mb-8 text-3xl font-semibold text-[#081F7C]">{heading}</h1> : null}
      <RichText
        className="space-y-5 leading-8 text-[#222] [&_a]:text-[#317DF5] [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#081F7C] [&_h3]:pt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:pt-1 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-[#317DF5] [&_ul]:ml-6 [&_ul]:list-disc [&_ol]:ml-6 [&_ol]:list-decimal [&_li]:mb-2 [&_li]:pl-1 [&_picture]:mx-auto [&_picture]:my-2 [&_picture]:block [&_picture]:max-w-[640px]"
        data={content}
      />
    </div>
  )

  if (variant === 'tinted') {
    return <section className={`${LIGHT_BLUE_BAND} pb-4 pt-12`}>{inner}</section>
  }

  return <section className="py-12">{inner}</section>
}
