import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = path.join(root, 'frontend', 'src')
const iconCssPath = path.join(sourceRoot, 'styles', 'mdi-subset.css')
const iconFontPath = path.join(root, 'frontend', 'public', 'fonts', 'mdi-subset.woff2')

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(entryPath))
    } else if (/\.(js|vue)$/.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files
}

test('all referenced MDI icons exist in the subset CSS', async () => {
  const css = await readFile(iconCssPath, 'utf8')
  const defined = new Set([...css.matchAll(/\.?(mdi-[a-z0-9-]+)::before/g)].map(match => match[1]))
  const used = new Set()

  for (const file of await collectSourceFiles(sourceRoot)) {
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(/mdi-[a-z0-9-]+/g)) {
      if (match[0] !== 'mdi-subset') used.add(match[0])
    }
  }

  const missing = [...used].filter(icon => !defined.has(icon))
  assert.deepEqual(missing, [])
})

test('generated MDI font is a compact WOFF2 subset', async () => {
  const font = await readFile(iconFontPath)
  assert.equal(font.subarray(0, 4).toString('ascii'), 'wOF2')
  assert.ok(font.length < 20_000, `subset font should stay compact, received ${font.length} bytes`)
})
