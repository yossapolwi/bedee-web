import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Window } from 'happy-dom'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

type TextNode = {
  type: 'text'
  mode: 'normal'
  text: string
  detail: number
  format: number
  style: string
  version: 1
}

type LexicalBlock =
  | {
      type: 'paragraph'
      children: TextNode[]
      direction: 'ltr'
      format: ''
      indent: 0
      version: 1
      textFormat: 0
      textStyle: ''
    }
  | {
      type: 'heading'
      tag: 'h2' | 'h3' | 'h4'
      children: TextNode[]
      direction: 'ltr'
      format: ''
      indent: 0
      version: 1
    }
  | {
      type: 'list'
      tag: 'ul' | 'ol'
      listType: 'bullet' | 'number'
      start: 1
      direction: 'ltr'
      format: ''
      indent: 0
      version: 1
      children: Array<{
        type: 'listitem'
        value: number
        children: TextNode[]
        direction: 'ltr'
        format: ''
        indent: 0
        version: 1
      }>
    }

const BOLD = 1

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function textNode(text: string, bold = false): TextNode {
  return {
    type: 'text',
    mode: 'normal',
    text,
    detail: 0,
    format: bold ? BOLD : 0,
    style: '',
    version: 1,
  }
}

function inlineChildren(element: Element): TextNode[] {
  const nodes: TextNode[] = []

  const walk = (node: Node) => {
    if (node.nodeType === node.TEXT_NODE) {
      const text = normalizeText(node.textContent)
      if (text) nodes.push(textNode(text))
      return
    }
    if (node.nodeType !== node.ELEMENT_NODE) return

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') {
      nodes.push(textNode('\n'))
      return
    }
    const bold = tag === 'b' || tag === 'strong'
    if (bold) {
      const text = normalizeText(el.textContent)
      if (text) nodes.push(textNode(text, true))
      return
    }
    el.childNodes.forEach(walk)
  }

  element.childNodes.forEach(walk)

  if (nodes.length === 0) {
    const fallback = normalizeText(element.textContent)
    if (fallback) nodes.push(textNode(fallback))
  }

  return nodes
}

function paragraphFromElement(element: Element): LexicalBlock | null {
  const children = inlineChildren(element)
  if (children.length === 0) return null
  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function headingFromElement(element: Element, tag: 'h2' | 'h3' | 'h4'): LexicalBlock | null {
  const text = normalizeText(element.textContent)
  if (!text) return null
  return {
    type: 'heading',
    tag,
    children: [textNode(text, true)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function listFromElement(element: Element): LexicalBlock | null {
  const tag = element.tagName.toLowerCase() as 'ul' | 'ol'
  const items = [...element.querySelectorAll(':scope > li')]
  if (items.length === 0) return null

  return {
    type: 'list',
    tag,
    listType: tag === 'ol' ? 'number' : 'bullet',
    start: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: items.map((li, index) => {
      const children = inlineChildren(li)
      return {
        type: 'listitem' as const,
        value: index + 1,
        children: children.length ? children : [textNode(normalizeText(li.textContent))],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1 as const,
      }
    }),
  }
}

function contentRoot(document: { querySelector: Document['querySelector'] }): Element | null {
  return (
    document.querySelector('.elementor-widget-text-editor .elementor-widget-container') ??
    document.querySelector('.elementor-widget-text-editor') ??
    document.querySelector('main') ??
    document.querySelector('article')
  )
}

/** Elementor terms pages wrap every <p> inside one <h2>; privacy pages use flat siblings. */
function legalContentContainer(root: Element): Element {
  const wrapperH2 = root.querySelector(':scope > h2')
  if (!wrapperH2) return root

  const paragraphCount = root.querySelectorAll('p').length
  const wrappedCount = wrapperH2.querySelectorAll('p').length
  if (paragraphCount > 0 && wrappedCount === paragraphCount) return wrapperH2

  return root
}

function classifyTermsParagraph(text: string): 'h2' | 'h3' | 'paragraph' {
  const normalized = normalizeText(text)
  if (!normalized) return 'paragraph'

  if (/^ข้อกำหนดและเงื่อนไขการใช้งานแพลตฟอร์ม$/u.test(normalized)) return 'h2'
  if (/^Terms of Use$/i.test(normalized)) return 'h2'
  if (/^หมวดที่\s*\d+/u.test(normalized) || /^Section\s+\d+/i.test(normalized)) return 'h3'

  return 'paragraph'
}

function blocksFromParagraphElement(element: Element, termsLayout: boolean): LexicalBlock[] {
  if (termsLayout) {
    const kind = classifyTermsParagraph(element.textContent ?? '')
    if (kind === 'h2') {
      const block = headingFromElement(element, 'h2')
      return block ? [block] : []
    }
    if (kind === 'h3') {
      const block = headingFromElement(element, 'h3')
      return block ? [block] : []
    }
  }

  const block = paragraphFromElement(element)
  return block ? [block] : []
}

export function parseLegalHtmlFile(relativePath: string, sourceUrl: string) {
  const htmlPath = path.join(repoRoot, 'reference', relativePath)
  const html = readFileSync(htmlPath, 'utf8')
  const window = new Window({ url: sourceUrl })
  window.document.write(html)
  const document = window.document

  const root = contentRoot(document)
  if (!root) throw new Error(`Could not find legal page content in ${relativePath}`)

  root
    .querySelectorAll('script, style, noscript, nav, form, footer')
    .forEach((node) => node.remove())

  const container = legalContentContainer(root)
  const termsLayout = container !== root || container.tagName.toLowerCase() === 'h2'

  const blocks: LexicalBlock[] = []
  let previous = ''

  container.querySelectorAll('p, ul, ol').forEach((node) => {
    const tag = node.tagName.toLowerCase()
    let newBlocks: LexicalBlock[] = []

    if (tag === 'p') newBlocks = blocksFromParagraphElement(node, termsLayout)
    else if (tag === 'ul' || tag === 'ol') {
      const list = listFromElement(node)
      if (list) newBlocks = [list]
    }

    for (const block of newBlocks) {
      const fingerprint = JSON.stringify(block)
      if (fingerprint === previous) continue
      previous = fingerprint
      blocks.push(block)
    }
  })

  if (blocks.length === 0) throw new Error(`No content blocks parsed from ${relativePath}`)

  const ogTitle = normalizeText(document.querySelector('meta[property="og:title"]')?.getAttribute('content'))
  const pageTitle = ogTitle
    .replace(/\s*-\s*BeDee\s*$/i, '')
    .replace(/\s+(EN|TH)\s*$/i, '')
    .trim()

  return {
    title: pageTitle || normalizeText(root.querySelector('h2')?.textContent) || relativePath,
    content: {
      root: {
        type: 'root' as const,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1 as const,
        children: blocks,
      },
    },
  }
}
