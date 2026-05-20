import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent
} from 'react'

import {
  DEFAULT_MODEL_ID,
  getModelById,
  IMAGE_GEN_MODELS,
  type ImageGenModel
} from './models'
import {
  fetchOpenRouterCredits,
  generateImageViaChat,
  type OpenRouterCredits
} from './openrouter'

const STORAGE_KEY = 'playground_openrouter_api_key'

function readStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read file'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}

function extensionFromDataUrl(url: string): string {
  const m = /^data:image\/([^;]+);/.exec(url)
  if (m?.[1] === 'jpeg') return 'jpg'
  if (m?.[1]) return m[1]!
  return 'png'
}

export default function App() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID)
  const [prompt, setPrompt] = useState('')
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const referenceObjectUrlRef = useRef<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [credits, setCredits] = useState<OpenRouterCredits | null>(null)
  const [creditsLoading, setCreditsLoading] = useState(false)
  const [creditsError, setCreditsError] = useState<string | null>(null)

  const selectedModel: ImageGenModel = useMemo(() => {
    return getModelById(modelId) ?? IMAGE_GEN_MODELS[0]!
  }, [modelId])

  const imagesLeftEstimate = useMemo(() => {
    if (!credits || selectedModel.avgUsdPerImage <= 0) return null
    return Math.floor(credits.remaining / selectedModel.avgUsdPerImage)
  }, [credits, selectedModel])

  useEffect(() => {
    try {
      if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [apiKey])

  useEffect(() => {
    return () => {
      if (referenceObjectUrlRef.current) {
        URL.revokeObjectURL(referenceObjectUrlRef.current)
      }
    }
  }, [])

  const refreshCredits = useCallback(async () => {
    if (!apiKey.trim()) {
      setCredits(null)
      setCreditsError(null)
      return
    }
    setCreditsLoading(true)
    setCreditsError(null)
    try {
      const c = await fetchOpenRouterCredits(apiKey.trim())
      setCredits(c)
    } catch (e) {
      setCredits(null)
      setCreditsError(
        e instanceof Error
          ? e.message
          : 'Could not load credits. OpenRouter may require a management-capable key for GET /credits; see OpenRouter account settings.'
      )
    } finally {
      setCreditsLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshCredits()
    }, 0)
    return () => window.clearTimeout(id)
  }, [refreshCredits])

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    e.target.value = ''
    if (referenceObjectUrlRef.current) {
      URL.revokeObjectURL(referenceObjectUrlRef.current)
      referenceObjectUrlRef.current = null
    }
    setReferenceFile(f)
    if (f) {
      const url = URL.createObjectURL(f)
      referenceObjectUrlRef.current = url
      setReferencePreview(url)
    } else {
      setReferencePreview(null)
    }
  }

  const onGenerate = async () => {
    setGenError(null)
    setResultUrl(null)
    const key = apiKey.trim()
    if (!key) {
      setGenError('Add your OpenRouter API key.')
      return
    }
    const text = prompt.trim()
    if (!text && !referenceFile) {
      setGenError('Enter a prompt and/or choose a reference image.')
      return
    }

    setLoading(true)
    try {
      let referenceDataUrl: string | undefined
      if (referenceFile) {
        referenceDataUrl = await readFileAsDataUrl(referenceFile)
      }
      const urls = await generateImageViaChat({
        apiKey: key,
        model: selectedModel.id,
        modalities: [...selectedModel.modalities],
        prompt: text,
        referenceImageUrl: referenceDataUrl
      })
      setResultUrl(urls[0] ?? null)
      void refreshCredits()
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const saveFilename = resultUrl
    ? `openrouter-image.${extensionFromDataUrl(resultUrl)}`
    : 'image.png'

  return (
    <>
      <h1>OpenRouter image generation</h1>
      <p className="lead">
        Your API key stays in this browser (local storage). Costs are billed by
        OpenRouter. “Images left” divides your remaining credits by a rough
        per-image estimate for the selected model.
      </p>

      <section className="panel" aria-label="Account">
        <div className="field">
          <label htmlFor="api-key">OpenRouter API key</label>
          <input
            id="api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-…"
          />
          <p className="hint">
            Stored only on your device. Use a key allowed for browser/CORS
            requests if your browser blocks the call.
          </p>
        </div>

        <div className="field">
          <label htmlFor="model">Model</label>
          <select
            id="model"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {IMAGE_GEN_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="hint">
            Est. ${selectedModel.avgUsdPerImage.toFixed(3)} per image (planning
            only).
          </p>
        </div>

        <div className="stats" aria-live="polite">
          <span>
            Balance:{' '}
            <strong>
              {creditsLoading
                ? '…'
                : credits
                  ? `$${credits.remaining.toFixed(2)}`
                  : creditsError
                    ? '—'
                    : '—'}
            </strong>
          </span>
          <span>
            Images left (est.):{' '}
            <strong>
              {creditsLoading
                ? '…'
                : imagesLeftEstimate !== null
                  ? imagesLeftEstimate
                  : '—'}
            </strong>
          </span>
          <button type="button" onClick={() => void refreshCredits()}>
            Refresh balance
          </button>
        </div>
        {creditsError ? <p className="error">{creditsError}</p> : null}
      </section>

      <section className="panel" aria-label="Generation">
        <div className="field">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want. If you add a reference image, describe how to use it."
          />
        </div>

        <div className="field">
          <label htmlFor="ref-file">Reference image (optional)</label>
          <div className="row">
            <input
              id="ref-file"
              type="file"
              accept="image/*"
              onChange={onPickFile}
            />
          </div>
          {referenceFile ? (
            <p className="file-name">{referenceFile.name}</p>
          ) : null}
          {referencePreview ? (
            <img
              className="ref-preview"
              src={referencePreview}
              alt="Reference preview"
            />
          ) : null}
        </div>

        <div className="row">
          <button
            type="button"
            className="primary"
            disabled={loading}
            onClick={() => void onGenerate()}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {genError ? <p className="error">{genError}</p> : null}

        {resultUrl ? (
          <div className="result-wrap">
            <h2 className="visually-hidden">Result</h2>
            <img src={resultUrl} alt="Generated result" />
            <div className="result-actions">
              <a
                className="primary"
                href={resultUrl}
                download={saveFilename}
                style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  padding: '0.55rem 1rem',
                  fontWeight: 500
                }}
              >
                Save to device
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}
