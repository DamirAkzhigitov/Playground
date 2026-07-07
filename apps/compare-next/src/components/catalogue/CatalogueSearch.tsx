'use client'

type CatalogueSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  label: string
}

export function CatalogueSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
  label
}: CatalogueSearchProps) {
  return (
    <div className="catalogue__search">
      <label className="visually-hidden" htmlFor="catalogue-search">
        {label}
      </label>
      <input
        id="catalogue-search"
        className="catalogue__search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
      />
    </div>
  )
}
