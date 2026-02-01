import fs from 'node:fs/promises'
import postcss from 'postcss'

const inputPath = process.argv[2] ?? 'dist/styles.raw.css'
const outputPath = process.argv[3] ?? inputPath

const css = await fs.readFile(inputPath, 'utf8')
const root = postcss.parse(css)

root.walkAtRules('layer', (rule) => {
  const nodes = rule.nodes ? [...rule.nodes] : []
  nodes.forEach((node) => {
    rule.before(node)
  })
  rule.remove()
})

await fs.writeFile(outputPath, root.toResult().css)
