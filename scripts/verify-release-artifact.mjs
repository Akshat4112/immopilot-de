import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

// Verify either the local build or a deployed build against an explicitly supplied commit.
// No scenario data is read or sent; only public static artifacts are requested.
const [expectedCommit, deployedURL] = process.argv.slice(2)
assert.match(expectedCommit ?? '', /^[a-f0-9]{40}$/, 'Supply the exact candidate commit SHA')
const base = deployedURL ? new URL(deployedURL) : undefined
if (base) {
  assert.equal(base.protocol, 'https:', 'Deployed verification requires HTTPS')
  assert.equal(base.pathname, '/immopilot-de/', 'Use the Pages application base path')
}
async function readArtifact(path) {
  if (!base) return readFile(`dist/${path}`)
  const response = await fetch(new URL(path, base), { cache: 'no-store' })
  assert.equal(response.status, 200, `Artifact unavailable: ${path}`)
  return Buffer.from(await response.arrayBuffer())
}

const manifest = JSON.parse((await readArtifact('release.json')).toString('utf8'))
assert.equal(manifest.schemaVersion, 1)
assert.equal(manifest.commit, expectedCommit, 'Deployed commit differs from candidate')
assert.equal(manifest.workingTreeDirty, false, 'Candidate must have no uncommitted changes')
assert.equal(manifest.basePath, '/immopilot-de/')
assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0, 'Missing artifact inventory')
const paths = new Set()
for (const file of manifest.files) {
  assert.equal(typeof file.path, 'string')
  assert.match(file.path, /^[a-zA-Z0-9_./-]+$/)
  assert.ok(!file.path.startsWith('/') && !file.path.split('/').includes('..'), 'Unsafe path')
  assert.ok(!paths.has(file.path), 'Duplicate artifact path')
  paths.add(file.path)
  assert.match(file.sha256, /^[a-f0-9]{64}$/)
  assert.equal(
    createHash('sha256')
      .update(await readArtifact(file.path))
      .digest('hex'),
    file.sha256,
    `Artifact digest mismatch: ${file.path}`,
  )
}
assert.ok(paths.has('index.html'), 'Missing application entry document')
assert.ok([...paths].some((path) => path.startsWith('assets/') && path.endsWith('.js')))
assert.ok([...paths].some((path) => path.startsWith('assets/') && path.endsWith('.css')))
console.log(`Verified ${manifest.files.length} static files for candidate ${expectedCommit}`)
