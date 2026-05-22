import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent
} from 'react'

import { findModelById, pickDefaultModelId, type ImageGenModel } from './models'
import {
  fetchOpenRouterCredits,
  fetchOpenRouterImageModels,
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

type HistoryEntry = {
  id: string
  url: string
}

function newHistoryId(): string {
  return crypto.randomUUID()
}

export default function App() {
  const [apiKey, setApiKey] = useState(readStoredApiKey)
  const [models, setModels] = useState<ImageGenModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [modelId, setModelId] = useState('')
  const modelsAbortRef = useRef<AbortController | null>(null)
  const [prompt, setPrompt] = useState('')
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const referenceObjectUrlRef = useRef<string | null>(null)
  const creditsAbortRef = useRef<AbortController | null>(null)
  const generateAbortRef = useRef<AbortController | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [credits, setCredits] = useState<OpenRouterCredits | null>(null)
  const [creditsLoading, setCreditsLoading] = useState(false)
  const [creditsError, setCreditsError] = useState<string | null>(null)

  const selectedModel: ImageGenModel | null = useMemo(() => {
    if (models.length === 0) return null
    return findModelById(models, modelId) ?? models[0]!
  }, [modelId, models])

  const imagesLeftEstimate = useMemo(() => {
    if (!credits || !selectedModel || selectedModel.avgUsdPerImage <= 0)
      return null
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

  const refreshModels = useCallback(async () => {
    modelsAbortRef.current?.abort()
    const controller = new AbortController()
    modelsAbortRef.current = controller

    setModelsLoading(true)
    setModelsError(null)
    try {
      const list = await fetchOpenRouterImageModels(
        apiKey.trim() || undefined,
        {
          signal: controller.signal
        }
      )
      if (controller.signal.aborted) return
      setModels(list)
      setModelId((prev) => {
        if (prev && list.some((m) => m.id === prev)) return prev
        return pickDefaultModelId(list)
      })
    } catch (e) {
      if (controller.signal.aborted) return
      setModels([])
      setModelsError(
        e instanceof Error ? e.message : 'Could not load models from OpenRouter'
      )
    } finally {
      if (!controller.signal.aborted) setModelsLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshModels()
    }, 0)
    return () => window.clearTimeout(id)
  }, [refreshModels])

  useEffect(() => {
    return () => {
      modelsAbortRef.current?.abort()
      creditsAbortRef.current?.abort()
      generateAbortRef.current?.abort()
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
    creditsAbortRef.current?.abort()
    const controller = new AbortController()
    creditsAbortRef.current = controller

    setCreditsLoading(true)
    setCreditsError(null)
    try {
      const c = await fetchOpenRouterCredits(apiKey.trim(), {
        signal: controller.signal
      })
      if (controller.signal.aborted) return
      setCredits(c)
    } catch (e) {
      if (controller.signal.aborted) return
      setCredits(null)
      setCreditsError(
        e instanceof Error
          ? e.message
          : 'Could not load credits. OpenRouter may require a management-capable key for GET /credits; see OpenRouter account settings.'
      )
    } finally {
      if (!controller.signal.aborted) setCreditsLoading(false)
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

  const removeFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id))
  }

  const onGenerate = async () => {
    setGenError(null)
    const key = apiKey.trim()
    if (!key) {
      setGenError('Add your OpenRouter API key.')
      return
    }
    if (!selectedModel) {
      setGenError(
        modelsLoading
          ? 'Loading models…'
          : (modelsError ?? 'No image model selected.')
      )
      return
    }
    const text = prompt.trim()
    if (!text && !referenceFile) {
      setGenError('Enter a prompt and/or choose a reference image.')
      return
    }

    generateAbortRef.current?.abort()
    const controller = new AbortController()
    generateAbortRef.current = controller

    setLoading(true)
    try {
      let referenceDataUrl: string | undefined
      if (referenceFile) {
        referenceDataUrl = await readFileAsDataUrl(referenceFile)
      }
      if (controller.signal.aborted) return

      const urls = await generateImageViaChat({
        apiKey: key,
        model: selectedModel.id,
        modalities: [...selectedModel.modalities],
        prompt: text,
        referenceImageUrl: referenceDataUrl,
        signal: controller.signal
      })
      if (controller.signal.aborted) return
      const newEntries = urls
        .filter((url): url is string => Boolean(url))
        .map((url) => ({ id: newHistoryId(), url }))
      if (newEntries.length > 0) {
        setHistory((prev) => [...newEntries, ...prev])
      }
      void refreshCredits()
    } catch (e) {
      if (controller.signal.aborted) return
      setGenError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return (
    <>
      <h1>OpenRouter image generation</h1>
      <p className="lead">
        Your API key stays in this browser (local storage). Costs are billed by
        OpenRouter. “Images left” divides your remaining credits by a rough
        per-image estimate for the selected model.
      </p>

      <section className="panel" aria-label="Create image">
        <div className="field">
          <label htmlFor="model">Model</label>
          <select
            id="model"
            value={modelId}
            disabled={modelsLoading || models.length === 0}
            onChange={(e) => setModelId(e.target.value)}
          >
            {modelsLoading ? (
              <option value="">Loading models…</option>
            ) : models.length === 0 ? (
              <option value="">No models available</option>
            ) : (
              models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))
            )}
          </select>
          {modelsError ? <p className="error">{modelsError}</p> : null}
          <p className="hint">
            {selectedModel
              ? `Est. $${selectedModel.avgUsdPerImage.toFixed(3)} per image (planning only). Catalog from OpenRouter.`
              : 'Model list loads from OpenRouter (image output).'}
          </p>
        </div>

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
            disabled={loading || modelsLoading || !selectedModel}
            onClick={() => void onGenerate()}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {genError ? <p className="error">{genError}</p> : null}

        {history.length > 0 ? (
          <div className="history" aria-label="Generated images">
            <h2 className="history-heading">Generated images</h2>
            <ul className="history-list">
              {history.map((entry) => {
                const saveFilename = `openrouter-image.${extensionFromDataUrl(entry.url)}`
                return (
                  <li key={entry.id} className="history-item">
                    <div className="history-item-body">
                      <img src={entry.url} alt="Generated result" />
                      <div className="result-actions">
                        <a
                          className="primary"
                          href={entry.url}
                          download={saveFilename}
                        >
                          Save to device
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="history-remove"
                      aria-label="Remove image from history"
                      onClick={() => removeFromHistory(entry.id)}
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="panel" aria-label="OpenRouter account">
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
    </>
  )
}
