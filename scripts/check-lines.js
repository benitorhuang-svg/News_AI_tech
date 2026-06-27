import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const LIMIT = 300
const ROOTS = ['src']
const EXTENSIONS = new Set(['.ts', '.css'])

function extensionOf(fileName) {
  const index = fileName.lastIndexOf('.')
  return index >= 0 ? fileName.slice(index) : ''
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) return collectFiles(path)
    if (EXTENSIONS.has(extensionOf(entry.name))) return [path]
    return []
  }))

  return files.flat()
}

const files = (await Promise.all(ROOTS.map(collectFiles))).flat()
const failures = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const lineCount = content.endsWith('\n')
    ? content.split('\n').length - 1
    : content.split('\n').length

  if (lineCount > LIMIT) failures.push({ file, lineCount })
}

if (failures.length) {
  console.error(`Files over ${LIMIT} lines:`)
  failures.forEach(({ file, lineCount }) => {
    console.error(`${file}: ${lineCount}`)
  })
  process.exit(1)
}

console.log(`Checked ${files.length} files. All are <= ${LIMIT} lines.`)
