import { snapdom } from '@zumer/snapdom'
import { jsPDF } from 'jspdf'

const LETTER_W_PT = 612
const LETTER_H_PT = 792

/**
 * Captura la plantilla con SnapDOM (render del navegador vía SVG)
 * y arma un PDF Letter. Evita html2canvas y el hack NBSP que rompía el wrap.
 */
export async function downloadCvPdf(
  element: HTMLElement,
  filename = 'CV_Martin_Simarra.pdf',
): Promise<void> {
  const canvas = await snapdom.toCanvas(element, {
    scale: 3,
    backgroundColor: '#ffffff',
    embedFonts: true,
    reconcile: true,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [LETTER_W_PT, LETTER_H_PT],
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0
  let pageIndex = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
  addLinkAnnotations(pdf, element, imgWidth / element.offsetWidth, pageIndex)
  heightLeft -= pageHeight

  while (heightLeft > 1) {
    position = heightLeft - imgHeight
    pdf.addPage([LETTER_W_PT, LETTER_H_PT])
    pageIndex += 1
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}

function addLinkAnnotations(
  pdf: jsPDF,
  element: HTMLElement,
  scale: number,
  pageIndex: number,
) {
  if (pageIndex !== 0) return

  const pageRect = element.getBoundingClientRect()
  const anchors = element.querySelectorAll<HTMLAnchorElement>('a.cv-link')

  anchors.forEach((anchor) => {
    const href = anchor.href
    if (!href) return
    const rect = anchor.getBoundingClientRect()
    const x = (rect.left - pageRect.left) * scale
    const y = (rect.top - pageRect.top) * scale
    const w = rect.width * scale
    const h = rect.height * scale
    pdf.link(x, y, w, h, { url: href })
  })
}
