import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'

export type ServiceHandle = {
  name: string
  pid: number
  child: ChildProcessWithoutNullStreams
}

export function spawnService(opts: {
  name: string
  cwd: string
  command: string
  args: string[]
  env?: NodeJS.ProcessEnv
}): ServiceHandle {
  const child = spawn(opts.command, opts.args, {
    cwd: opts.cwd,
    env: opts.env ?? process.env,
    stdio: 'pipe',
    detached: true
  })

  child.stdout.on('data', (chunk: Buffer) => {
    process.stdout.write(`[${opts.name}] ${chunk}`)
  })
  child.stderr.on('data', (chunk: Buffer) => {
    process.stderr.write(`[${opts.name}] ${chunk}`)
  })

  child.unref()

  if (!child.pid) {
    throw new Error(`Failed to start ${opts.name}`)
  }

  return { name: opts.name, pid: child.pid, child }
}
