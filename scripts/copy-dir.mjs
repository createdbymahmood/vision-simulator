import {copyFile, mkdir, readdir, stat} from 'node:fs/promises'
import path from 'node:path'

const [input, output] = process.argv.slice(2)

if (!input || !output) {
  console.error('Usage: node scripts/copy-dir.mjs <inputDir> <outputDir>')
  process.exit(1)
}

const resolvedInput = path.resolve(input)
const resolvedOutput = path.resolve(output)

const copyDir = async (sourceDir, targetDir) => {
  await mkdir(targetDir, {recursive: true})
  const entries = await readdir(sourceDir, {withFileTypes: true})

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = path.join(sourceDir, entry.name)
      const targetPath = path.join(targetDir, entry.name)

      if (entry.isDirectory()) {
        await copyDir(sourcePath, targetPath)
        return
      }

      if (entry.isFile()) {
        await mkdir(path.dirname(targetPath), {recursive: true})
        await copyFile(sourcePath, targetPath)
      }
    }),
  )
}

const inputStat = await stat(resolvedInput)
if (!inputStat.isDirectory()) {
  console.error(`Input must be a directory: ${resolvedInput}`)
  process.exit(1)
}

await copyDir(resolvedInput, resolvedOutput)

