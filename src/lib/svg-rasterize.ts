import { Font } from 'vexflow'

let fontCssPromise: Promise<string> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function fetchFontDataUri(fontName: string): Promise<string> {
  const url = Font.getURLForFont(fontName)
  if (!url) throw new Error(`Font ${fontName} is unavailable for PDF export`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${fontName} for PDF export`)
  }

  const base64 = arrayBufferToBase64(await response.arrayBuffer())
  return `data:font/woff2;base64,${base64}`
}

async function getVexflowFontCss(): Promise<string> {
  if (!fontCssPromise) {
    fontCssPromise = (async () => {
      const [bravura, academico] = await Promise.all([
        fetchFontDataUri('Bravura'),
        fetchFontDataUri('Academico'),
      ])
      return `
@font-face {
  font-family: 'Bravura';
  src: url('${bravura}') format('woff2');
  font-display: block;
}
@font-face {
  font-family: 'Academico';
  src: url('${academico}') format('woff2');
  font-display: swap;
}
`
    })()
  }
  return fontCssPromise
}

async function prepareSvgForRasterize(svg: SVGSVGElement): Promise<SVGSVGElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const ns = 'http://www.w3.org/2000/svg'

  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', ns)
  }

  const defs = document.createElementNS(ns, 'defs')
  const style = document.createElementNS(ns, 'style')
  style.textContent = await getVexflowFontCss()
  defs.appendChild(style)
  clone.insertBefore(defs, clone.firstChild)

  return clone
}

async function svgToCanvas(
  svg: SVGSVGElement,
  width: number,
  height: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const prepared = await prepareSvgForRasterize(svg)
  prepared.setAttribute('width', String(width))
  prepared.setAttribute('height', String(height))

  const svgString = new XMLSerializer().serializeToString(prepared)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to rasterize SVG'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

function getRelativeOffset(
  parent: HTMLElement,
  child: Element,
): { x: number; y: number; width: number; height: number } {
  const parentRect = parent.getBoundingClientRect()
  const childRect = child.getBoundingClientRect()
  return {
    x: childRect.left - parentRect.left,
    y: childRect.top - parentRect.top,
    width: childRect.width,
    height: childRect.height,
  }
}

/** Rasterize a score system (VexFlow stave + finger diagrams) at the given scale. */
export async function rasterizeScoreSystem(
  wrapper: HTMLElement,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const width = wrapper.offsetWidth
  const height = wrapper.offsetHeight
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const svgs = wrapper.querySelectorAll('svg')
  for (const svg of svgs) {
    const { x, y, width: svgWidth, height: svgHeight } = getRelativeOffset(wrapper, svg)
    if (svgWidth <= 0 || svgHeight <= 0) continue

    const svgCanvas = await svgToCanvas(svg as SVGSVGElement, svgWidth, svgHeight, scale)
    ctx.drawImage(svgCanvas, x * scale, y * scale)
  }

  return canvas
}
