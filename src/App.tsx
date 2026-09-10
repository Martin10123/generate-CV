import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CvDocument } from './components/CvDocument'
import './components/cvDocument.css'
import {
  adaptCv,
  ingestCv,
  loadStoredApiKey,
  saveApiKey,
} from './lib/adaptCv'
import {
  EXAMPLE_CV,
  cvDataToPlainText,
  cvFileName,
} from './lib/cvDefaults'
import type { CvData } from './lib/cvTypes'
import { downloadCvPdf } from './lib/downloadCvPdf'
import { readCvUpload } from './lib/readCvUpload'

function App() {
  const [apiKey, setApiKey] = useState(() => loadStoredApiKey())
  const [jobOffer, setJobOffer] = useState('')
  const [currentCv, setCurrentCv] = useState('')
  const [cvData, setCvData] = useState<CvData>(EXAMPLE_CV)
  /** Solo true tras “Cargar en plantilla” con el CV del usuario. */
  const [cvReady, setCvReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(!loadStoredApiKey())
  const cvRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetToExample() {
    setCvData(EXAMPLE_CV)
    setCurrentCv('')
    setCvReady(false)
    setError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setCopied(false)

    if (!cvReady) {
      setError(
        'Primero sube o pega tu CV y pulsa “Cargar en plantilla” para usar tus datos.',
      )
      return
    }

    if (!jobOffer.trim() || !currentCv.trim()) {
      setError('Pega la oferta laboral y asegúrate de tener tu CV cargado.')
      return
    }

    setLoading(true)
    try {
      saveApiKey(apiKey)
      const adapted = await adaptCv({ jobOffer, currentCv, apiKey })
      setCvData(adapted)
      setCurrentCv(cvDataToPlainText(adapted))
      setCvReady(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo adaptar el CV')
    } finally {
      setLoading(false)
    }
  }

  async function handleIngest() {
    setError('')
    setCopied(false)

    if (!currentCv.trim()) {
      setError('Sube un archivo o pega tu CV antes de cargarlo en la plantilla.')
      return
    }

    setIngesting(true)
    try {
      saveApiKey(apiKey)
      const structured = await ingestCv({ currentCv, apiKey })
      setCvData(structured)
      setCurrentCv(cvDataToPlainText(structured))
      setCvReady(true)
    } catch (err) {
      setCvReady(false)
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar el CV',
      )
    } finally {
      setIngesting(false)
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setError('')
    setCvReady(false)
    try {
      const text = await readCvUpload(file)
      setCurrentCv(text)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo leer el archivo',
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleCopy() {
    const text = cvDataToPlainText(cvData)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload() {
    if (!cvReady) {
      setError(
        'Primero carga tu CV en la plantilla. El ejemplo no se descarga como tuyo.',
      )
      return
    }

    const node = cvRef.current?.querySelector('[data-cv-page]')
    if (!(node instanceof HTMLElement)) {
      setError('No se encontró la plantilla del CV para descargar.')
      return
    }

    setDownloading(true)
    setError('')
    try {
      await downloadCvPdf(node, cvFileName(cvData))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo generar el PDF',
      )
    } finally {
      setDownloading(false)
    }
  }

  const busy = loading || ingesting || uploading || downloading
  const canAdapt = cvReady && !busy

  return (
    <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,#e8f0ec_0%,#f4f6f5_45%,#eef1ef_100%)] text-stone-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-stone-300/60 pb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-teal-800 uppercase">
            CV Adapt
          </p>
          <h1 className="max-w-2xl font-serif text-3xl leading-tight tracking-tight text-stone-900 sm:text-4xl">
            Adapta el texto. La plantilla no se mueve.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            Primero carga tus datos. Luego adapta el texto a la vacante.
            Tipografía, negritas y layout quedan fijos.
          </p>
        </header>

        <section
          className={`rounded-2xl border px-4 py-3 text-sm ${
            cvReady
              ? 'border-teal-700/30 bg-teal-50/80 text-teal-950'
              : 'border-amber-700/25 bg-amber-50/90 text-amber-950'
          }`}
        >
          {cvReady ? (
            <p>
              CV propio cargado ({cvData.name}). Ya puedes pegar una oferta y
              pulsar “Adaptar CV”.
            </p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5">
              <li>Sube tu CV (.txt / .md / .pdf) o pega tus datos.</li>
              <li>Pulsa “Cargar en plantilla” para fijar tus datos.</li>
              <li>Recién ahí podrás adaptar a una oferta.</li>
            </ol>
          )}
        </section>

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
            <div className="flex min-h-72 flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-stone-800">
                  1. Tu CV
                </span>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.markdown,.pdf,text/plain,application/pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <Upload data-icon="inline-start" />
                    )}
                    {uploading ? 'Leyendo…' : 'Subir CV'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={resetToExample}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
              <textarea
                value={currentCv}
                onChange={(event) => {
                  setCurrentCv(event.target.value)
                  setCvReady(false)
                }}
                placeholder="Obligatorio: pega tu CV o súbelo (.txt / .md / .pdf). El ejemplo de la vista previa no cuenta como tus datos."
                className="min-h-72 flex-1 resize-y rounded-2xl border border-stone-300/80 bg-white/80 p-4 font-mono text-xs leading-relaxed outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || !currentCv.trim()}
                  className="bg-teal-800 text-white hover:bg-teal-900"
                  onClick={handleIngest}
                >
                  {ingesting ? (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Upload data-icon="inline-start" />
                  )}
                  {ingesting ? 'Cargando…' : 'Cargar en plantilla'}
                </Button>
                <p className="text-xs text-stone-500">
                  Paso obligatorio antes de adaptar.
                </p>
              </div>
            </div>

            <label className="flex min-h-72 flex-col gap-2">
              <span className="text-sm font-medium text-stone-800">
                2. Oferta de trabajo
              </span>
              <textarea
                value={jobOffer}
                onChange={(event) => setJobOffer(event.target.value)}
                disabled={!cvReady}
                placeholder={
                  cvReady
                    ? 'Pega aquí la vacante, requisitos y responsabilidades…'
                    : 'Bloqueado hasta que cargues tu CV en la plantilla…'
                }
                className="min-h-72 flex-1 resize-y rounded-2xl border border-stone-300/80 bg-white/80 p-4 text-sm leading-relaxed outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={!canAdapt}
              title={
                cvReady
                  ? undefined
                  : 'Primero carga tu CV en la plantilla'
              }
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
              disabled={busy || !cvReady}
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
              disabled={busy || !cvReady}
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
            Vista previa{' '}
            {cvReady ? (
              <span className="font-normal text-stone-500">
                (tus datos)
              </span>
            ) : (
              <span className="font-normal text-stone-500">
                (ejemplo — no es editable hasta cargar tu CV)
              </span>
            )}
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
