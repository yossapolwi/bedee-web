import type { ReactNode } from 'react'

type ParagraphBlock = { type: 'p'; text: string }
type ListBlock = { type: 'list'; items: string[] }
export type FaqAnswerBlock = ParagraphBlock | ListBlock

/** Splits FAQ textarea answers into paragraphs and `- item` bullet lists. */
export function parseFaqAnswerBlocks(text: string): FaqAnswerBlock[] {
  const blocks: FaqAnswerBlock[] = []
  let listItems: string[] = []
  let paraLines: string[] = []

  const flushParagraph = () => {
    if (!paraLines.length) return
    blocks.push({ type: 'p', text: paraLines.join(' ') })
    paraLines = []
  }

  const flushList = () => {
    if (!listItems.length) return
    blocks.push({ type: 'list', items: listItems })
    listItems = []
  }

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      flushParagraph()
      continue
    }

    const bullet = trimmed.match(/^-\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      listItems.push(bullet[1])
    } else {
      flushList()
      paraLines.push(trimmed)
    }
  }

  flushList()
  flushParagraph()
  return blocks
}

const listClass = 'ml-6 list-disc space-y-2'
const itemClass = 'pl-1'

export function FaqAnswerContent({ text }: { text: string }) {
  const blocks = parseFaqAnswerBlocks(text)
  if (!blocks.length) return null

  const nodes: ReactNode[] = []

  blocks.forEach((block, i) => {
    if (block.type === 'list') {
      nodes.push(
        <ul key={`list-${i}`} className={`${listClass}${i > 0 ? ' mt-3' : ''}`}>
          {block.items.map((item, j) => (
            <li key={j} className={itemClass}>
              {item}
            </li>
          ))}
        </ul>,
      )
      return
    }

    nodes.push(
      <p key={`p-${i}`} className={i > 0 ? 'mt-3' : undefined}>
        {block.text}
      </p>,
    )
  })

  return <>{nodes}</>
}
