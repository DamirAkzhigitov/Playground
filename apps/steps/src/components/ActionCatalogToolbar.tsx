import { Search, X } from 'lucide-react'

import type { CatalogSort } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type ActionCatalogToolbarProps = {
  query: string
  tag: string
  sort: CatalogSort
  onQueryChange: (value: string) => void
  onTagChange: (value: string) => void
  onSortChange: (value: CatalogSort) => void
  onClear: () => void
  hasFilters: boolean
}

export function ActionCatalogToolbar({
  query,
  tag,
  sort,
  onQueryChange,
  onTagChange,
  onSortChange,
  onClear,
  hasFilters
}: ActionCatalogToolbarProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border sm:px-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search guides…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
          aria-label="Search actions"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Filter by tag"
          value={tag}
          onChange={(e) => onTagChange(e.target.value)}
          className="max-w-[10rem] sm:max-w-[12rem]"
          aria-label="Filter by tag"
        />

        <Select
          value={sort}
          onValueChange={(v) => onSortChange(v as CatalogSort)}
        >
          <SelectTrigger className="w-[9rem]" aria-label="Sort actions">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="title">A–Z</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1"
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  )
}
