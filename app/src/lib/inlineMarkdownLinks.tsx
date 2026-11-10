import type { ReactNode } from 'react'

const safeUrl = (url: string) => (url && /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : undefined)

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g

/** Renders plain text with optional `[label](url)` segments (https/mailto/tel/path only). */
export function renderInlineMarkdownLinks(text: string, linkClassName?: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(LINK_PATTERN)) {
    const full = match[0]
    const label = match[1]
    const rawUrl = match[2]
    const index = match.index ?? 0

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }

    const href = safeUrl(rawUrl.trim())
    if (href) {
      const isExternal = href.startsWith('http')
      nodes.push(
        <a
          key={`${index}-${label}`}
          href={href}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={linkClassName}
        >
          {label}
        </a>,
      )
    } else {
      nodes.push(full)
    }

    lastIndex = index + full.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length ? nodes : [text]
}
