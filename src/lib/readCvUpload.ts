import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorker

const TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
])

function isTextFile(file: File): boolean {
  if (TEXT_TYPES.has(file.type)) return true
  return /\.(txt|md|markdown|json)$/i.test(file.name)
}

function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  )
}

async function readTextFile(file: File): Promise<string> {
  return file.text()
}

async function readPdfFile(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await getDocument({ data }).promise
  const pages: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (line) pages.push(line)
  }

  const text = pages.join('\n\n').trim()
  if (!text) {
    throw new Error(
      'No se pudo extraer texto del PDF (puede ser un escaneo/imagen).',
    )
  }
  return text
}

/** Lee un CV subido (.txt, .md, .pdf) y devuelve texto plano. */
export async function readCvUpload(file: File): Promise<string> {
  if (isTextFile(file)) {
    const text = (await readTextFile(file)).trim()
    if (!text) throw new Error('El archivo de texto está vacío.')
    return text
  }

  if (isPdfFile(file)) {
    return readPdfFile(file)
  }

  throw new Error('Formato no soportado. Sube un .txt, .md o .pdf.')
}
