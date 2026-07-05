import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { Song } from './types'

const UNSUPPORTED_COLOR_FN = /oklch|oklab|lch\(|lab\(|color\(/i

const STYLE_PROPERTIES = [
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
] as const

function resolveColorToRgb(color: string, doc: Document): string {
  const probe = doc.createElement('span')
  probe.style.color = color
  doc.body.appendChild(probe)
  const resolved = doc.defaultView?.getComputedStyle(probe).color ?? color
  doc.body.removeChild(probe)
  return resolved
}

function replaceUnsupportedColorFunctions(value: string, doc: Document): string {
  if (!value || !UNSUPPORTED_COLOR_FN.test(value)) return value

  return value.replace(
    /(?:oklch|oklab|lch|lab|color)\([^)]*\)/gi,
    (match) => resolveColorToRgb(match, doc),
  )
}

/** html2canvas cannot parse Tailwind 4 oklch() colors from stylesheets. */
function sanitizeCloneForHtml2Canvas(
  clonedDoc: Document,
  clonedRoot: HTMLElement,
  sourceRoot: HTMLElement,
): void {
  clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove())

  const win = clonedDoc.defaultView ?? window

  const walk = (cloneEl: Element, sourceEl: Element) => {
    const cloneHtml = cloneEl as HTMLElement
    const sourceHtml = sourceEl as HTMLElement

    cloneHtml.removeAttribute('class')

    const computed = win.getComputedStyle(sourceHtml)
    for (const prop of STYLE_PROPERTIES) {
      let value = computed.getPropertyValue(prop)
      if (!value || value === 'none') continue
      value = replaceUnsupportedColorFunctions(value, clonedDoc)
      cloneHtml.style.setProperty(prop, value)
    }

    const sourceChildren = Array.from(sourceEl.children)
    const cloneChildren = Array.from(cloneEl.children)
    for (let i = 0; i < sourceChildren.length; i++) {
      const cloneChild = cloneChildren[i]
      if (cloneChild) walk(cloneChild, sourceChildren[i])
    }
  }

  walk(clonedRoot, sourceRoot)
}

export async function exportSongToPdf(song: Song, scoreElement: HTMLElement): Promise<void> {
  if (!song.title.trim()) {
    throw new Error('Please add a title before exporting.')
  }

  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-9999px'
  wrapper.style.top = '0'
  wrapper.style.width = '800px'
  wrapper.style.background = '#ffffff'
  wrapper.style.padding = '40px'
  wrapper.style.fontFamily = 'Segoe UI, system-ui, sans-serif'
  wrapper.style.color = '#2c1810'

  const header = document.createElement('div')
  header.style.marginBottom = '24px'
  header.style.borderBottom = '2px solid #8b6914'
  header.style.paddingBottom = '16px'

  const title = document.createElement('h1')
  title.textContent = song.title
  title.style.margin = '0 0 8px'
  title.style.fontSize = '28px'
  title.style.fontWeight = '600'
  header.appendChild(title)

  if (song.composer?.trim()) {
    const composer = document.createElement('p')
    composer.textContent = `Composer: ${song.composer}`
    composer.style.margin = '0 0 4px'
    composer.style.fontSize = '14px'
    composer.style.color = '#5c4033'
    header.appendChild(composer)
  }

  if (song.recommendedKey?.trim()) {
    const keyLine = document.createElement('p')
    keyLine.textContent = `Recommended flute key: ${song.recommendedKey}`
    keyLine.style.margin = '0 0 4px'
    keyLine.style.fontSize = '14px'
    keyLine.style.color = '#5c4033'
    header.appendChild(keyLine)
  }

  const date = document.createElement('p')
  date.textContent = `Exported: ${new Date().toLocaleDateString()}`
  date.style.margin = '0'
  date.style.fontSize = '12px'
  date.style.color = '#8b6914'
  header.appendChild(date)

  wrapper.appendChild(header)

  const scoreClone = scoreElement.cloneNode(true) as HTMLElement
  scoreClone.style.transform = 'scale(1)'
  scoreClone.style.transformOrigin = 'top left'
  wrapper.appendChild(scoreClone)

  document.body.appendChild(wrapper)

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        sanitizeCloneForHtml2Canvas(clonedDoc, clonedElement, wrapper)
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
    document.body.removeChild(wrapper)
  }
}
