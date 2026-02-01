import {copyFile, mkdir} from 'node:fs/promises'
import path from 'node:path'

const [input, output] = process.argv.slice(2)

if (!input || !output) {
  console.error('Usage: node scripts/copy-file.mjs <input> <output>')
  process.exit(1)
}

const resolvedInput = path.resolve(input)
const resolvedOutput = path.resolve(output)

await mkdir(path.dirname(resolvedOutput), {recursive: true})
await copyFile(resolvedInput, resolvedOutput)
