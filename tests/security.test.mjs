import test from 'node:test'
import assert from 'node:assert/strict'
import { File } from 'node:buffer'
import { readFile } from 'node:fs/promises'

globalThis.File = File

const {
  ALLOWED_EXTENSIONS,
  getSafeContentType,
  validateAndSanitizeFile,
  validateFileType,
} = await import('../functions/utils/security.js')

const supportedAliases = [
  '.apng', '.cur', '.dib', '.jfif', '.pjp', '.pjpeg',
]

test('frontend image aliases are accepted by backend validation', () => {
  for (const extension of supportedAliases) {
    assert.ok(ALLOWED_EXTENSIONS.includes(extension), `${extension} should be allowed`)
    assert.equal(validateFileType({ name: `image${extension}`, type: '' }).allowed, true)
  }
})

test('upload picker extensions stay in sync with backend validation', async () => {
  const uploadView = await readFile(new URL('../frontend/src/views/Upload.vue', import.meta.url), 'utf8')
  const accept = uploadView.match(/accept="([^"]+)"/)?.[1] || ''
  const pickerExtensions = accept
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(value => value.startsWith('.'))

  assert.ok(pickerExtensions.length > 0)
  for (const extension of pickerExtensions) {
    assert.ok(ALLOWED_EXTENSIONS.includes(extension), `${extension} is accepted by the picker but rejected by the backend`)
  }
})

test('safe content types cover image aliases', () => {
  assert.equal(getSafeContentType('image.apng'), 'image/apng')
  assert.equal(getSafeContentType('image.cur'), 'image/x-icon')
  assert.equal(getSafeContentType('image.dib'), 'image/bmp')
  assert.equal(getSafeContentType('image.jfif'), 'image/jpeg')
})

test('unsupported extensions are rejected', () => {
  const result = validateFileType({ name: 'payload.html', type: 'text/html' })
  assert.equal(result.allowed, false)
})

test('SVG uploads return sanitized file contents', async () => {
  const source = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect onload="alert(2)" width="10" height="10" /></svg>'
  const result = await validateAndSanitizeFile(new File([source], 'image.svg', { type: 'image/svg+xml' }))

  assert.equal(result.valid, true)
  assert.ok(result.file)
  const sanitized = await result.file.text()
  assert.doesNotMatch(sanitized, /<script/i)
  assert.doesNotMatch(sanitized, /onload/i)
})
