import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { useI18n } from '@/contexts/I18nContext'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createApartmentFormSchema,
  parsePriceField,
  type ApartmentFormValues
} from '@/lib/apartmentForm'

type ApartmentFormProps = {
  defaultValues: ApartmentFormValues
  onSubmit: (values: {
    title: string
    address: string | null
    price: number | null
    notes: string | null
  }) => void | Promise<void>
}

export function ListingForm({ defaultValues, onSubmit }: ApartmentFormProps) {
  const { t } = useI18n()
  const schema = useMemo(() => createApartmentFormSchema(t), [t])
  const resolver = useMemo(() => zodResolver(schema), [schema])

  const form = useForm<ApartmentFormValues>({
    resolver,
    defaultValues
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const price = parsePriceField(values.price)
    if (values.price?.trim() && price === null) {
      form.setError('price', { message: t('apartmentForm.validNumber') })
      return
    }
    await onSubmit({
      title: values.title.trim(),
      address: values.address?.trim() ? values.address.trim() : null,
      price,
      notes: values.notes?.trim() ? values.notes.trim() : null
    })
  })

  return (
    <Form {...form}>
      <form id="apartment-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('apartmentForm.title')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('apartmentForm.titlePlaceholder')}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('apartmentForm.address')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('apartmentForm.addressPlaceholder')}
                  autoComplete="street-address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('apartmentForm.price')}</FormLabel>
              <FormControl>
                <Input
                  inputMode="decimal"
                  placeholder={t('apartmentForm.priceOptional')}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('apartmentForm.notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('apartmentForm.notesPlaceholder')}
                  rows={4}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
