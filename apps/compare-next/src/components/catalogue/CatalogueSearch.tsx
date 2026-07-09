'use client'

import { SearchIcon } from 'lucide-react'

import { Field, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group'

type CatalogueSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}

export function CatalogueSearch({
  value,
  onChange,
  placeholder,
  label
}: CatalogueSearchProps) {
  return (
    <Field>
      <FieldLabel className="sr-only" htmlFor="catalogue-search">
        {label}
      </FieldLabel>
      <InputGroup className="h-11">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          id="catalogue-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </InputGroup>
    </Field>
  )
}
