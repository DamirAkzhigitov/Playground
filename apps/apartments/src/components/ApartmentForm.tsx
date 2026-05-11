import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
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
  apartmentFormSchema,
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
  submitLabel: string
  isPending?: boolean
}

export function ApartmentForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isPending = false
}: ApartmentFormProps) {
  const form = useForm<ApartmentFormValues>({
    resolver: zodResolver(apartmentFormSchema),
    defaultValues
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const price = parsePriceField(values.price)
    if (values.price?.trim() && price === null) {
      form.setError('price', { message: 'Enter a valid number.' })
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Riverside 2BR"
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Street, city"
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
              <FormLabel>Price (€)</FormLabel>
              <FormControl>
                <Input
                  inputMode="decimal"
                  placeholder="Optional"
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Anything you want to remember before the visit…"
                  rows={4}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  )
}
