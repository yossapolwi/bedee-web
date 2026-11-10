import Image from 'next/image'

type Item = {
  icon: { url?: string | null; alt?: string | null }
  title: string
  description?: string | null
}

export function FeatureSteps({
  kicker,
  heading,
  description,
  items,
  variant = 'light',
  ctaLabel,
  ctaUrl,
}: {
  kicker?: string | null
  heading: string
  description?: string | null
  items: Item[]
  variant?: 'light' | 'dark' | null
  ctaLabel?: string | null
  ctaUrl?: string | null
}) {
  if (!items?.length) return null
  const isDark = variant === 'dark'
  const cols = items.length === 6 ? 'lg:grid-cols-3' : 'lg:grid-cols-5'
  const safeUrl = (url?: string | null) =>
    url && /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : undefined
  const href = safeUrl(ctaUrl)
  const isExternal = href?.startsWith('http')

  return (
    <section className={isDark ? 'bg-primary py-16' : 'bg-white py-16'}>
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="max-w-3xl">
          {kicker && (
            <p className={`text-sm font-semibold tracking-wide ${isDark ? 'text-white' : 'text-primary'}`}>
              {kicker}
            </p>
          )}
          <h2
            className={`mt-2 whitespace-pre-line text-3xl font-semibold leading-tight md:text-4xl ${isDark ? 'text-white' : 'text-primary'}`}
          >
            {heading}
          </h2>
          {description ? (
            <p
              className={`mt-4 text-base font-medium leading-relaxed md:text-lg ${isDark ? 'text-white/80' : 'text-ink'}`}
            >
              {description}
            </p>
          ) : null}
        </div>
        <ul className={`mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 ${cols}`}>
          {items.map((item, i) => (
            <li
              key={i}
              className={`group relative overflow-hidden p-6 transition-colors duration-200 ease-out ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-panel-1 hover:bg-[#EAF1FF]'
              }`}
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full ${
                  isDark ? 'bg-accent/10' : 'bg-secondary/10'
                }`}
              />
              {item.icon?.url && (
                <Image
                  src={item.icon.url}
                  alt={item.icon.alt || ''}
                  width={56}
                  height={56}
                  className="relative h-14 w-14 object-contain transition-transform duration-200 ease-out group-hover:scale-105"
                />
              )}
              <h3 className={`relative mt-4 text-lg font-semibold leading-snug ${isDark ? 'text-white' : 'text-primary'}`}>
                {item.title}
              </h3>
              {item.description && (
                <p className={`relative mt-2 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-muted'}`}>
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
        {ctaLabel && href ? (
          <a
            href={href}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`mt-10 inline-block rounded-pill px-6 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(49,125,245,0.4)] ${
              isDark ? 'bg-white text-primary' : 'bg-accent'
            }`}
          >
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </section>
  )
}
