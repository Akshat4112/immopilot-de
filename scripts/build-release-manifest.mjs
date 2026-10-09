import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'

const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const workingTreeDirty = Boolean(
  execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
)

async function inventory(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) files.push(...(await inventory(path)))
    else if (entry.isFile() && path !== 'dist/release.json') {
      files.push({
        path: path.slice('dist/'.length),
        sha256: createHash('sha256')
          .update(await readFile(path))
          .digest('hex'),
      })
    }
  }
  return files
}

const manifest = {
  schemaVersion: 1,
  commit,
  workingTreeDirty,
  basePath: '/immopilot-de/',
  files: await inventory('dist'),
}
await writeFile('dist/release.json', `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Release artifact: ${commit}${workingTreeDirty ? ' (uncommitted changes)' : ''}`)
