// Simple post-hero intro: H2 + supporting copy + primary CTA. Used when a
// service page needs a short "why this" band without icon cards or imagery.
export function IntroCta({
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  heading: string
  body?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
}) {
  const safeUrl = (url?: string | null) =>
    url && /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : undefined

  const href = safeUrl(ctaUrl)
  const isExternal = href?.startsWith('http')

  return (
    <section className="border-b border-black/[0.06] bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-primary md:text-[40px] md:leading-[1.15]">
          {heading}
        </h2>
        {body ? (
          <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-ink md:mt-6">{body}</p>
        ) : null}
        {ctaLabel && href ? (
          <a
            href={href}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="mt-8 inline-block rounded-pill bg-accent px-6 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(49,125,245,0.4)]"
          >
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </section>
  )
}
