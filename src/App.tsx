import { useRef, useState, type FormEvent } from 'react'
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CvDocument } from './components/CvDocument'
import './components/cvDocument.css'
import { adaptCv, loadStoredApiKey, saveApiKey } from './lib/adaptCv'
import { QUEEN_CV, cvDataToPlainText } from './lib/cvDefaults'
import type { CvData } from './lib/cvTypes'
import { downloadCvPdf } from './lib/downloadCvPdf'

function App() {
  const [apiKey, setApiKey] = useState(() => loadStoredApiKey())
  const [jobOffer, setJobOffer] = useState('')
  const [currentCv, setCurrentCv] = useState(() => cvDataToPlainText(QUEEN_CV))
  const [cvData, setCvData] = useState<CvData>(QUEEN_CV)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(!loadStoredApiKey())
  const cvRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setCopied(false)

    if (!jobOffer.trim() || !currentCv.trim()) {
      setError('Pega la oferta laboral y tu CV actual.')
      return
    }

    setLoading(true)
    try {
      saveApiKey(apiKey)
      const adapted = await adaptCv({ jobOffer, currentCv, apiKey })
      setCvData(adapted)
      setCurrentCv(cvDataToPlainText(adapted))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo adaptar el CV')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    const text = cvDataToPlainText(cvData)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload() {
    const node = cvRef.current?.querySelector('[data-cv-page]')
    if (!(node instanceof HTMLElement)) {
      setError('No se encontró la plantilla del CV para descargar.')
      return
    }

    setDownloading(true)
    setError('')
    try {
      await downloadCvPdf(node, 'CV_Martin_Simarra.pdf')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo generar el PDF',
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,#e8f0ec_0%,#f4f6f5_45%,#eef1ef_100%)] text-stone-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-stone-300/60 pb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-teal-800 uppercase">
            CV Adapt
          </p>
          <h1 className="max-w-2xl font-serif text-3xl leading-tight tracking-tight text-stone-900 sm:text-4xl">
            Adapta el texto. La plantilla reina no se mueve.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            Tipografía, negritas, líneas y layout de{' '}
            <code className="rounded bg-stone-200/70 px-1">CV_MARTIN_C#.pdf</code>{' '}
            quedan fijos. Solo cambia el contenido al adaptar.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="rounded-2xl border border-stone-300/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-800">
                <KeyRound className="size-4 text-teal-800" />
                API key de Gemini
              </div>
              <button
                type="button"
                className="text-xs text-teal-800 underline-offset-2 hover:underline"
                onClick={() => setShowKey((value) => !value)}
              >
                {showKey ? 'Ocultar' : 'Mostrar / editar'}
              </button>
            </div>
            {showKey ? (
              <div className="flex flex-col gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="AIza... (o deja vacío si usas GEMINI_API_KEY en .env)"
                  className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  autoComplete="off"
                />
                <p className="text-xs text-stone-500">
                  Consíguela en{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-800 underline-offset-2 hover:underline"
                  >
                    Google AI Studio
                  </a>
                  . Se guarda solo en este navegador.
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                Key guardada en el navegador
                {apiKey ? ` (…${apiKey.slice(-4)})` : ' — o vía .env'}.
              </p>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex min-h-72 flex-col gap-2">
              <span className="text-sm font-medium text-stone-800">
                Oferta de trabajo
              </span>
              <textarea
                value={jobOffer}
                onChange={(event) => setJobOffer(event.target.value)}
                placeholder="Pega aquí la vacante, requisitos y responsabilidades…"
                className="min-h-72 flex-1 resize-y rounded-2xl border border-stone-300/80 bg-white/80 p-4 text-sm leading-relaxed outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
              />
            </label>

            <label className="flex min-h-72 flex-col gap-2">
              <span className="text-sm font-medium text-stone-800">
                CV base (plantilla reina precargada)
              </span>
              <textarea
                value={currentCv}
                onChange={(event) => setCurrentCv(event.target.value)}
                className="min-h-72 flex-1 resize-y rounded-2xl border border-stone-300/80 bg-white/80 p-4 font-mono text-xs leading-relaxed outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="bg-teal-800 text-white hover:bg-teal-900"
            >
              {loading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {loading ? 'Adaptando…' : 'Adaptar CV'}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={downloading}
              onClick={handleDownload}
            >
              {downloading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              {downloading ? 'Generando PDF…' : 'Descargar PDF'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleCopy}
            >
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? 'Copiado' : 'Copiar texto'}
            </Button>
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-stone-800">
            Vista previa (plantilla fija)
          </h2>
          <div className="overflow-auto rounded-2xl border border-stone-300/80 bg-stone-200/50 p-4">
            <div
              ref={cvRef}
              className="mx-auto origin-top shadow-md"
              style={{ width: '612pt' }}
            >
              <CvDocument cv={cvData} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
