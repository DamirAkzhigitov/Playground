#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const summaryPath = join(
  root,
  'apps/compare-next/coverage/coverage-summary.json'
)
const readmePath = join(root, 'README.md')
const badgePattern =
  /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-[a-z]+\)/

function badgeColor(percent) {
  if (percent >= 80) return 'brightgreen'
  if (percent >= 60) return 'yellowgreen'
  if (percent >= 40) return 'yellow'
  return 'orange'
}

function runCoverage() {
  const result = spawnSync(
    'pnpm',
    ['--filter', '@playground/compare-next', 'test:coverage'],
    {
      cwd: root,
      stdio: 'inherit'
    }
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function readCoveragePercent() {
  if (!existsSync(summaryPath)) {
    runCoverage()
  }

  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'))
  return Math.round(summary.total.lines.pct)
}

function updateReadme(percent) {
  const badge = `![Coverage](https://img.shields.io/badge/coverage-${percent}%25-${badgeColor(percent)})`
  const readme = readFileSync(readmePath, 'utf8')

  if (badgePattern.test(readme)) {
    writeFileSync(readmePath, readme.replace(badgePattern, badge))
    return
  }

  writeFileSync(
    readmePath,
    readme.replace(/^# Playground\n\n/m, `# Playground\n\n${badge}\n\n`)
  )
}

const percent = readCoveragePercent()
updateReadme(percent)
console.log(`Updated README coverage badge to ${percent}%`)
