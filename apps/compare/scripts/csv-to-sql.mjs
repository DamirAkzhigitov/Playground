#!/usr/bin/env node
// @ts-ignore
/**
 * Convert compare bulk-import CSV + manifest → D1 SQL.
 *
 * Usage:
 *   node scripts/csv-to-sql.mjs --dir import-templates/gpu-example
 *   node scripts/csv-to-sql.mjs --dir ./my-import --out /tmp/import.sql
 *   node scripts/csv-to-sql.mjs --dir ./my-import --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseArgs(argv) {
  const args = { dir: '.', out: null, dryRun: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dir' && argv[i + 1]) args.dir = argv[++i]
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i]
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--help' || a === '-h') {
      console.log(
        `Usage: node csv-to-sql.mjs --dir <bundle> [--out file.sql] [--dry-run]`
      )
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${a}`)
    }
  }
  return args
}

/** Minimal RFC 4180 CSV parser */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let i = 0
  let inQuotes = false

  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function isValidIsoDate(value) {
  if (!ISO_DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function nowIso() {
  return new Date().toISOString()
}

function flattenSpecsFromTemplate(sections) {
  const specs = []
  for (const section of sections) {
    for (const spec of section.specs ?? []) {
      specs.push(spec)
    }
  }
  return specs
}

function loadManifest(dir) {
  const manifestPath = join(dir, 'import-manifest.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}`)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (!manifest.itemTypeId || !manifest.userId) {
    throw new Error('import-manifest.json requires itemTypeId and userId')
  }
  if (!Array.isArray(manifest.specs) || manifest.specs.length === 0) {
    const templatePath = join(dir, 'spec-template.json')
    if (!existsSync(templatePath)) {
      throw new Error('manifest.specs missing and no spec-template.json found')
    }
    const sections = JSON.parse(readFileSync(templatePath, 'utf8'))
    manifest.specs = flattenSpecsFromTemplate(sections)
  }
  return manifest
}

function specById(manifest) {
  return new Map(manifest.specs.map((s) => [s.id, s]))
}

function validateValue(spec, raw, rowNum, col) {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: true, empty: true, value: null }

  switch (spec.type) {
    case 'text':
      return { ok: true, empty: false, value: trimmed }
    case 'number': {
      if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: number must be decimal (got ${JSON.stringify(raw)})`
        }
      }
      return { ok: true, empty: false, value: trimmed }
    }
    case 'date': {
      if (!isValidIsoDate(trimmed)) {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: date must be YYYY-MM-DD (got ${JSON.stringify(raw)})`
        }
      }
      return { ok: true, empty: false, value: trimmed }
    }
    case 'boolean': {
      if (trimmed !== 'true' && trimmed !== 'false') {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: boolean must be true or false (got ${JSON.stringify(raw)})`
        }
      }
      return { ok: true, empty: false, value: trimmed }
    }
    case 'select': {
      const allowed = new Set((spec.options ?? []).map((o) => o.value))
      if (!allowed.has(trimmed)) {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: select value must be one of [${[...allowed].join(', ')}] (got ${JSON.stringify(raw)})`
        }
      }
      return { ok: true, empty: false, value: trimmed }
    }
    case 'multi-select': {
      let parsed
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: multi-select must be JSON array string`
        }
      }
      if (!Array.isArray(parsed)) {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: multi-select must be JSON array`
        }
      }
      const allowed = new Set((spec.options ?? []).map((o) => o.value))
      for (const v of parsed) {
        if (typeof v !== 'string' || !allowed.has(v)) {
          return {
            ok: false,
            error: `row ${rowNum} ${col}: invalid multi-select entry ${JSON.stringify(v)}`
          }
        }
      }
      return { ok: true, empty: false, value: trimmed }
    }
    case 'rating': {
      if (!/^-?\d+$/.test(trimmed)) {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: rating must be integer (got ${JSON.stringify(raw)})`
        }
      }
      const n = Number(trimmed)
      const min = spec.ratingMin ?? 1
      const max = spec.ratingMax ?? 5
      if (n < min || n > max) {
        return {
          ok: false,
          error: `row ${rowNum} ${col}: rating ${n} outside ${min}..${max}`
        }
      }
      return { ok: true, empty: false, value: trimmed }
    }
    default:
      return {
        ok: false,
        error: `row ${rowNum} ${col}: unknown spec type ${spec.type}`
      }
  }
}

function parseColumnName(header) {
  const answer = header.match(/^answer:(.+)$/)
  if (answer) return { kind: 'answer', specId: answer[1] }
  const note = header.match(/^note:(.+)$/)
  if (note) return { kind: 'note', specId: note[1] }
  return { kind: 'item', name: header }
}

function main() {
  const args = parseArgs(process.argv)
  const dir = resolve(args.dir)
  const manifest = loadManifest(dir)
  const specs = specById(manifest)

  const csvPath = join(dir, 'items.csv')
  if (!existsSync(csvPath)) {
    throw new Error(`Missing ${csvPath}`)
  }

  const table = parseCsv(readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''))
  if (table.length < 2) {
    throw new Error(
      'items.csv must have a header row and at least one data row'
    )
  }

  const headers = table[0]
  const columns = headers.map(parseColumnName)

  for (const col of columns) {
    if (col.kind === 'answer' || col.kind === 'note') {
      if (!specs.has(col.specId)) {
        throw new Error(`Unknown spec id in header: ${col.specId}`)
      }
    }
  }

  if (!columns.some((c) => c.kind === 'item' && c.name === 'title')) {
    throw new Error('items.csv must include a title column')
  }

  const errors = []
  const itemInserts = []
  const answerInserts = []
  const ts = nowIso()

  for (let r = 1; r < table.length; r++) {
    const cells = table[r]
    if (cells.every((c) => c.trim() === '')) continue

    const rowNum = r + 1
    let title = ''
    let notes = null
    let isPublic = 0
    let itemId = randomUUID()

    const answers = new Map()
    const notesBySpec = new Map()

    for (let c = 0; c < columns.length; c++) {
      const col = columns[c]
      const raw = cells[c] ?? ''
      if (col.kind === 'item') {
        if (col.name === 'title') title = raw.trim()
        else if (col.name === 'notes')
          notes = raw.trim() === '' ? null : raw.trim()
        else if (col.name === 'is_public') isPublic = raw.trim() === '1' ? 1 : 0
        else if (col.name === 'item_id' && raw.trim() !== '')
          itemId = raw.trim()
      } else if (col.kind === 'answer') {
        const spec = specs.get(col.specId)
        const result = validateValue(spec, raw, rowNum, headers[c])
        if (!result.ok) errors.push(result.error)
        else if (!result.empty) answers.set(col.specId, result.value)
      } else if (col.kind === 'note') {
        const trimmed = raw.trim()
        if (trimmed !== '') notesBySpec.set(col.specId, trimmed)
      }
    }

    if (!title) {
      errors.push(`row ${rowNum}: title is required`)
      continue
    }
    if (title.length > 200) {
      errors.push(`row ${rowNum}: title exceeds 200 characters`)
    }

    for (const spec of manifest.specs) {
      if (spec.required && !answers.has(spec.id)) {
        errors.push(
          `row ${rowNum}: missing required answer for ${spec.id} (${spec.label})`
        )
      }
    }

    itemInserts.push(
      `INSERT INTO items (id, item_type_id, user_id, title, notes, is_public, created_at, updated_at) VALUES (${[
        sqlString(itemId),
        sqlString(manifest.itemTypeId),
        sqlString(manifest.userId),
        sqlString(title),
        notes === null ? 'NULL' : sqlString(notes),
        String(isPublic),
        sqlString(ts),
        sqlString(ts)
      ].join(', ')});`
    )

    for (const [specId, value] of answers) {
      const note = notesBySpec.get(specId) ?? null
      answerInserts.push(
        `INSERT INTO answers (id, item_id, spec_id, value, note, updated_at) VALUES (${[
          sqlString(randomUUID()),
          sqlString(itemId),
          sqlString(specId),
          sqlString(value),
          note === null ? 'NULL' : sqlString(note),
          sqlString(ts)
        ].join(
          ', '
        )}) ON CONFLICT(item_id, spec_id) DO UPDATE SET value = excluded.value, note = excluded.note, updated_at = excluded.updated_at;`
      )
    }
  }

  if (errors.length > 0) {
    console.error('Validation failed:\n' + errors.join('\n'))
    process.exit(1)
  }

  const sql = [
    '-- Generated by apps/compare/scripts/csv-to-sql.mjs',
    `-- itemTypeId: ${manifest.itemTypeId}`,
    `-- items: ${itemInserts.length}, answers: ${answerInserts.length}`,
    'BEGIN TRANSACTION;',
    '',
    ...itemInserts,
    '',
    ...answerInserts,
    '',
    'COMMIT;',
    ''
  ].join('\n')

  if (args.dryRun) {
    console.log(
      `OK: ${itemInserts.length} items, ${answerInserts.length} answers (dry run)`
    )
    return
  }

  if (args.out) {
    writeFileSync(args.out, sql, 'utf8')
    console.log(
      `Wrote ${args.out} (${itemInserts.length} items, ${answerInserts.length} answers)`
    )
  } else {
    process.stdout.write(sql)
  }
}

try {
  main()
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
