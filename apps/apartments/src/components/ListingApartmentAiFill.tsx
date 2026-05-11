import { useState } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/contexts/I18nContext'
import { apiRequest, ApiError } from '@/lib/api'
import type { ListingExtractResponse } from '@/types/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const MAX_PASTE = 48_000

type SourceTab = 'paste' | 'url' | 'file'

type ListingApartmentAiFillProps = {
  onApplied: (data: ListingExtractResponse) => void
}

export function ListingApartmentAiFill({
  onApplied
}: ListingApartmentAiFillProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<SourceTab>('paste')
  const [pasteText, setPasteText] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const runExtract = async () => {
    if (busy) return

    if (tab === 'paste' && !pasteText.trim()) {
      toast.error(t('apartmentAi.needSource'))
      return
    }
    if (tab === 'url' && !url.trim()) {
      toast.error(t('apartmentAi.needSource'))
      return
    }
    if (tab === 'file' && !file) {
      toast.error(t('apartmentAi.needSource'))
      return
    }

    setBusy(true)
    try {
      let data: ListingExtractResponse
      if (tab === 'paste') {
        const text = pasteText.trim()
        data = await apiRequest<ListingExtractResponse>(
          '/api/apartments/extract-listing',
          { method: 'POST', body: { text } }
        )
      } else if (tab === 'url') {
        const u = url.trim()
        data = await apiRequest<ListingExtractResponse>(
          '/api/apartments/extract-listing',
          { method: 'POST', body: { url: u } }
        )
      } else {
        const fd = new FormData()
        fd.append('file', file!)
        data = await apiRequest<ListingExtractResponse>(
          '/api/apartments/extract-listing',
          { method: 'POST', body: fd }
        )
      }
      onApplied(data)
      toast.success(t('apartmentAi.applied'))
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        toast.error(t('apartmentAi.unavailable'))
        return
      }
      toast.error(e instanceof Error ? e.message : t('apartmentAi.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {t('apartmentAi.cardTitle')}
        </CardTitle>
        <CardDescription>{t('apartmentAi.cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as SourceTab)}
          className="gap-3"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste">{t('apartmentAi.tabPaste')}</TabsTrigger>
            <TabsTrigger value="url">{t('apartmentAi.tabUrl')}</TabsTrigger>
            <TabsTrigger value="file">{t('apartmentAi.tabFile')}</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="space-y-2">
            <Label htmlFor="listing-ai-paste">
              {t('apartmentAi.pasteLabel')}
            </Label>
            <Textarea
              id="listing-ai-paste"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value.slice(0, MAX_PASTE))}
              placeholder={t('apartmentAi.pastePlaceholder')}
              rows={5}
              className="resize-y min-h-[120px] font-mono text-sm"
            />
          </TabsContent>
          <TabsContent value="url" className="space-y-2">
            <Label htmlFor="listing-ai-url">{t('apartmentAi.urlLabel')}</Label>
            <Input
              id="listing-ai-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('apartmentAi.urlPlaceholder')}
            />
          </TabsContent>
          <TabsContent value="file" className="space-y-2">
            <Label htmlFor="listing-ai-file">
              {t('apartmentAi.fileLabel')}
            </Label>
            <Input
              id="listing-ai-file"
              type="file"
              accept=".txt,.md,.json,text/plain,text/markdown,application/json"
              className="cursor-pointer"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setFile(f ?? null)
              }}
            />
            <p className="text-muted-foreground text-xs">
              {t('apartmentAi.fileHint')}
            </p>
          </TabsContent>
        </Tabs>
        <Button
          type="button"
          variant="secondary"
          className="w-full min-h-11"
          disabled={busy}
          onClick={() => void runExtract()}
        >
          {busy ? t('apartmentAi.extracting') : t('apartmentAi.extract')}
        </Button>
      </CardContent>
    </Card>
  )
}
