import { jsPDF } from 'jspdf'
import { rasterizeScoreSystem } from './svg-rasterize'
import type { Song } from './types'

const PAGE_MARGIN = 36
const HEADER_COLOR: [number, number, number] = [44, 24, 16]
const MUTED_COLOR: [number, number, number] = [92, 64, 51]
const ACCENT_COLOR: [number, number, number] = [139, 105, 20]

function ensurePageSpace(pdf: jsPDF, y: number, needed: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight()
  if (y + needed <= pageHeight - PAGE_MARGIN) return y

  pdf.addPage()
  return PAGE_MARGIN
}

function addRasterImage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  maxWidth: number,
): number {
  const imgWidth = maxWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight)
  return imgHeight
}

export async function exportSongToPdf(song: Song, scoreElement: HTMLElement): Promise<void> {
  if (!song.title.trim()) {
    throw new Error('Please add a title before exporting.')
  }

  await document.fonts.ready

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  let y = PAGE_MARGIN

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(28)
  pdf.setTextColor(...HEADER_COLOR)
  const titleLines = pdf.splitTextToSize(song.title, contentWidth)
  y = ensurePageSpace(pdf, y, titleLines.length * 32 + 8)
  pdf.text(titleLines, PAGE_MARGIN, y + 28)
  y += titleLines.length * 32 + 8

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(14)
  pdf.setTextColor(...MUTED_COLOR)

  if (song.composer?.trim()) {
    y = ensurePageSpace(pdf, y, 18)
    pdf.text(`Composer: ${song.composer}`, PAGE_MARGIN, y + 14)
    y += 18
  }

  if (song.recommendedKey?.trim()) {
    y = ensurePageSpace(pdf, y, 18)
    pdf.text(`Recommended flute key: ${song.recommendedKey}`, PAGE_MARGIN, y + 14)
    y += 18
  }

  pdf.setFontSize(12)
  pdf.setTextColor(...ACCENT_COLOR)
  y = ensurePageSpace(pdf, y, 16)
  pdf.text(`Exported: ${new Date().toLocaleDateString()}`, PAGE_MARGIN, y + 12)
  y += 24

  pdf.setDrawColor(...ACCENT_COLOR)
  pdf.setLineWidth(1.5)
  pdf.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y)
  y += 20

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(120, 53, 15)
  y = ensurePageSpace(pdf, y, 20)
  pdf.text('Score', PAGE_MARGIN, y + 14)
  y += 24

  const scoreContainer = scoreElement.querySelector('.score-container')
  const systemWrappers = scoreContainer?.querySelectorAll(':scope > div') ?? []

  for (const wrapper of systemWrappers) {
    const canvas = await rasterizeScoreSystem(wrapper as HTMLElement, 2)
    const imgHeight = (canvas.height * contentWidth) / canvas.width
    y = ensurePageSpace(pdf, y, imgHeight + 8)
    const drawnHeight = addRasterImage(pdf, canvas, PAGE_MARGIN, y, contentWidth)
    y += drawnHeight + 8
  }

  const filename = `${song.title.replace(/[^\w\s-]/g, '').trim() || 'melody'}.pdf`
  pdf.save(filename)
}
