import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { Song } from './types'

const UNSUPPORTED_COLOR_FN = /oklch|oklab|lch\(|lab\(|color\(/i

const COLOR_PROPERTIES = [
  'color',
  'background-color',
  'background',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'outline-color',
  'text-decoration-color',
  'box-shadow',
  'fill',
  'stroke',
  'stop-color',
  'flood-color',
  'lighting-color',
  '-webkit-text-stroke-color',
] as const

const LAYOUT_PROPERTIES = [
  'font-size',
  'font-weight',
  'font-family',
  'font-style',
  'line-height',
  'text-align',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-radius',
  'opacity',
  'display',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'transform',
  'transform-origin',
  'overflow',
  'overflow-x',
  'overflow-y',
  'white-space',
  'flex',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'vertical-align',
] as const

const STYLE_PROPERTIES = [...COLOR_PROPERTIES, ...LAYOUT_PROPERTIES] as const

const SVG_COLOR_ATTRS = ['fill', 'stroke', 'stop-color', 'color', 'flood-color', 'lighting-color'] as const

/** Resolve any CSS color (including oklch) to rgb/hex via canvas. */
function resolveColorToRgb(color: string, doc: Document): string {
  const trimmed = color.trim()
  if (!trimmed || trimmed === 'none' || trimmed === 'transparent') return trimmed
  if (!UNSUPPORTED_COLOR_FN.test(trimmed)) return trimmed

  const canvas = doc.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return trimmed

  try {
    ctx.fillStyle = '#000000'
    ctx.fillStyle = trimmed
    return ctx.fillStyle
  } catch {
    const probe = doc.createElement('span')
    probe.style.color = trimmed
    doc.body.appendChild(probe)
    const resolved = doc.defaultView?.getComputedStyle(probe).color ?? trimmed
    doc.body.removeChild(probe)
    return resolved
  }
}

function replaceUnsupportedColorFunctions(value: string, doc: Document): string {
  if (!value || !UNSUPPORTED_COLOR_FN.test(value)) return value

  return value.replace(
    /(?:oklch|oklab|lch|lab|color)\([^)]*\)/gi,
    (match) => resolveColorToRgb(match, doc),
  )
}

function sanitizeStyleAttribute(style: string, doc: Document): string {
  if (!UNSUPPORTED_COLOR_FN.test(style)) return style
  return style
    .split(';')
    .map((rule) => {
      const colon = rule.indexOf(':')
      if (colon === -1) return rule
      const prop = rule.slice(0, colon).trim()
      const val = rule.slice(colon + 1).trim()
      if (!val || !UNSUPPORTED_COLOR_FN.test(val)) return rule
      return `${prop}: ${replaceUnsupportedColorFunctions(val, doc)}`
    })
    .join(';')
}

function stripStylesheets(clonedDoc: Document): void {
  clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove())
  clonedDoc.documentElement.style.backgroundColor = '#ffffff'
  clonedDoc.documentElement.style.color = '#2c1810'
  if (clonedDoc.body) {
    clonedDoc.body.style.backgroundColor = '#ffffff'
    clonedDoc.body.style.color = '#2c1810'
  }
}

/**
 * Inline computed styles as rgb/hex on every node.
 * Must run on the SOURCE tree before html2canvas — it parses getComputedStyle during
 * its initial clone pass (before onclone), so Tailwind oklch values crash if left in place.
 */
function inlineComputedStylesAsRgb(root: HTMLElement, doc: Document): void {
  const view = doc.defaultView ?? window
  const elements: Element[] = [root, ...root.querySelectorAll('*')]

  for (const el of elements) {
    const html = el as HTMLElement
    html.removeAttribute('class')

    const computed = view.getComputedStyle(html)
    for (const prop of STYLE_PROPERTIES) {
      let value = computed.getPropertyValue(prop)
      if (!value || value === 'none' || value === 'normal') continue
      if (COLOR_PROPERTIES.includes(prop as (typeof COLOR_PROPERTIES)[number])) {
        value = replaceUnsupportedColorFunctions(value, doc)
      }
      html.style.setProperty(prop, value)
    }

    const styleAttr = html.getAttribute('style')
    if (styleAttr && UNSUPPORTED_COLOR_FN.test(styleAttr)) {
      html.setAttribute('style', sanitizeStyleAttribute(styleAttr, doc))
    }

    if (el instanceof SVGElement) {
      for (const attr of SVG_COLOR_ATTRS) {
        const attrVal = el.getAttribute(attr)
        if (attrVal && UNSUPPORTED_COLOR_FN.test(attrVal)) {
          el.setAttribute(attr, resolveColorToRgb(attrVal, doc))
        }
      }
    }
  }
}

function assertNoOklch(root: HTMLElement, context: string): void {
  if (!import.meta.env.DEV) return
  const html = root.outerHTML
  if (UNSUPPORTED_COLOR_FN.test(html)) {
    console.warn(`[pdf-export] ${context}: oklch/oklab still present in export tree`)
  }
}

function buildScoreSection(scoreElement: HTMLElement): HTMLElement {
  const section = document.createElement('div')
  section.style.marginTop = '16px'

  const label = document.createElement('h2')
  label.textContent = 'Score'
  label.style.margin = '0 0 12px'
  label.style.fontSize = '16px'
  label.style.fontWeight = '600'
  label.style.color = '#78350f'
  section.appendChild(label)

  const scoreContainer = scoreElement.querySelector('.score-container')
  if (scoreContainer) {
    section.appendChild(scoreContainer.cloneNode(true))
    return section
  }

  section.appendChild(scoreElement.cloneNode(true))
  return section
}

export async function exportSongToPdf(song: Song, scoreElement: HTMLElement): Promise<void> {
  if (!song.title.trim()) {
    throw new Error('Please add a title before exporting.')
  }

  const doc = document
  const wrapper = doc.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-9999px'
  wrapper.style.top = '0'
  wrapper.style.width = '800px'
  wrapper.style.background = '#ffffff'
  wrapper.style.padding = '40px'
  wrapper.style.fontFamily = 'Segoe UI, system-ui, sans-serif'
  wrapper.style.color = '#2c1810'

  const header = doc.createElement('div')
  header.style.marginBottom = '24px'
  header.style.borderBottom = '2px solid #8b6914'
  header.style.paddingBottom = '16px'

  const title = doc.createElement('h1')
  title.textContent = song.title
  title.style.margin = '0 0 8px'
  title.style.fontSize = '28px'
  title.style.fontWeight = '600'
  header.appendChild(title)

  if (song.composer?.trim()) {
    const composer = doc.createElement('p')
    composer.textContent = `Composer: ${song.composer}`
    composer.style.margin = '0 0 4px'
    composer.style.fontSize = '14px'
    composer.style.color = '#5c4033'
    header.appendChild(composer)
  }

  if (song.recommendedKey?.trim()) {
    const keyLine = doc.createElement('p')
    keyLine.textContent = `Recommended flute key: ${song.recommendedKey}`
    keyLine.style.margin = '0 0 4px'
    keyLine.style.fontSize = '14px'
    keyLine.style.color = '#5c4033'
    header.appendChild(keyLine)
  }

  const date = doc.createElement('p')
  date.textContent = `Exported: ${new Date().toLocaleDateString()}`
  date.style.margin = '0'
  date.style.fontSize = '12px'
  date.style.color = '#8b6914'
  header.appendChild(date)

  wrapper.appendChild(header)
  wrapper.appendChild(buildScoreSection(scoreElement))

  doc.body.appendChild(wrapper)

  try {
    inlineComputedStylesAsRgb(wrapper, doc)
    assertNoOklch(wrapper, 'after inlineComputedStylesAsRgb')

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        stripStylesheets(clonedDoc)
      },
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 36
    const maxWidth = pageWidth - margin * 2
    const imgWidth = maxWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
    }

    const filename = `${song.title.replace(/[^\w\s-]/g, '').trim() || 'melody'}.pdf`
    pdf.save(filename)
  } finally {
    doc.body.removeChild(wrapper)
  }
}
