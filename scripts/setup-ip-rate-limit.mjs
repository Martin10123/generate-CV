import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const payload = JSON.stringify({
  name: 'Rate limit adapt-cv',
  description: '6 POST /api/adapt-cv por IP cada 10 min',
  conditionGroup: [
    {
      conditions: [
        { type: 'path', op: 'eq', value: '/api/adapt-cv' },
        { type: 'method', op: 'eq', value: 'POST' },
      ],
    },
  ],
  action: {
    mitigate: {
      action: 'rate_limit',
      rateLimit: {
        algo: 'fixed_window',
        window: 600,
        limit: 6,
        keys: ['ip'],
        action: 'rate_limit',
      },
    },
  },
})

function run(args) {
  const result = spawnSync('npx', ['--yes', 'vercel', ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  })
  if (result.status) process.exit(result.status)
}

if (!existsSync(path.join(rootDir, '.vercel', 'project.json'))) {
  run(['link', '--yes', '--project', 'generate-taupe'])
}

run(['firewall', 'rules', 'add', '--json', payload, '--yes'])
run(['firewall', 'publish', '--yes'])
