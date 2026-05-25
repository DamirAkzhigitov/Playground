#!/usr/bin/env node
import { appendFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workerRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const logDir = join(workerRoot, 'logs')
const port = Number(process.env.LOCAL_LOG_PORT || 8799)

function logFilePath() {
  const day = new Date().toISOString().slice(0, 10)
  return join(logDir, `${day}.ndjson`)
}

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method !== 'POST' || req.url !== '/log') {
    res.writeHead(404)
    res.end()
    return
  }

  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks).toString('utf8')
      if (!body.trim()) {
        res.writeHead(400)
        res.end('empty body')
        return
      }
      mkdirSync(logDir, { recursive: true })
      appendFileSync(
        logFilePath(),
        body.endsWith('\n') ? body : `${body}\n`,
        'utf8'
      )
      res.writeHead(204)
      res.end()
    } catch (err) {
      console.error('[localLogServer] write failed', err)
      res.writeHead(500)
      res.end(String(err))
    }
  })
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(
      `[localLogServer] port ${port} already in use — assuming another log server is running`
    )
    process.exit(0)
  }
  console.error('[localLogServer] failed to start', err)
  process.exit(1)
})

server.listen(port, '127.0.0.1', () => {
  console.log(
    `[localLogServer] POST http://127.0.0.1:${port}/log -> ${logDir}/YYYY-MM-DD.ndjson`
  )
})
