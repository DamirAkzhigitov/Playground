import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useI18n } from '@/contexts/I18nContext'
import { useCreateSpec, useItemTypeTemplate, useItemTypes } from '@/hooks'
import type { SpecType } from '@/types'

const SPEC_TYPES: SpecType[] = [
  'text',
  'number',
  'boolean',
  'select',
  'multi-select',
  'rating'
]

export function SpecEditorPage() {
  const { typeId } = useParams<{ typeId: string }>()
  const { t } = useI18n()
  const { data: types } = useItemTypes()
  const itemType = types?.find((type) => type.id === typeId)
  const {
    data: template,
    isPending,
    isError,
    error
  } = useItemTypeTemplate(typeId)
  const createSpec = useCreateSpec(typeId ?? '')

  const [label, setLabel] = useState('')
  const [type, setType] = useState<SpecType>('text')
  const [sectionId, setSectionId] = useState('')

  if (!typeId) {
    return <ErrorState message={t('errors.notFound')} />
  }

  if (isPending) {
    return <LoadingState label={t('specEditor.loading')} />
  }

  if (isError) {
    return <ErrorState message={error.message} />
  }

  if (!itemType || itemType.isSystem) {
    return <ErrorState message={t('specEditor.notEditable')} />
  }

  const sections = template ?? []
  const activeSectionId = sectionId || sections[0]?.id || ''

  const handleAddSpec = async () => {
    if (!label.trim() || !activeSectionId) return
    try {
      await createSpec.mutateAsync({
        label: label.trim(),
        type,
        sectionId: activeSectionId,
        required: false
      })
      setLabel('')
      toast.success(t('specEditor.specAdded'))
    } catch {
      toast.error(t('specEditor.specAddFailed'))
    }
  }

  return (
    <section className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/add-item">{t('common.back')}</Link>
      </Button>
      <PageHeader
        title={t('specEditor.title', { name: itemType.name })}
        description={t('specEditor.description')}
      />

      <div className="space-y-4 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">{t('specEditor.addSpec')}</h2>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('specEditor.labelPlaceholder')}
          className="min-h-11"
        />
        <Select value={type} onValueChange={(v) => setType(v as SpecType)}>
          <SelectTrigger className="min-h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEC_TYPES.map((specType) => (
              <SelectItem key={specType} value={specType}>
                {specType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sections.length > 0 ? (
          <Select value={activeSectionId} onValueChange={setSectionId}>
            <SelectTrigger className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button
          type="button"
          className="min-h-11 w-full gap-1"
          onClick={handleAddSpec}
          disabled={createSpec.isPending}
        >
          <Plus className="size-4" aria-hidden />
          {t('specEditor.addSpec')}
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border p-4">
            <h3 className="mb-2 text-sm font-semibold">{section.name}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {section.specs.length === 0 ? (
                <li>{t('specEditor.noSpecs')}</li>
              ) : (
                section.specs.map((spec) => (
                  <li key={spec.id}>
                    {spec.label} <span className="text-xs">({spec.type})</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
