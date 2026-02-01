import fs from 'node:fs/promises'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

const inputPath = process.argv[2] ?? 'dist/styles.css'
const outputPath = process.argv[3] ?? inputPath
const prefix = process.env.TW_CLASS_PREFIX ?? 'PREFIX-'

if (!prefix) {
  throw new Error('TW_CLASS_PREFIX must be a non-empty string.')
}

const css = await fs.readFile(inputPath, 'utf8')
const root = postcss.parse(css)

const transformSelector = selectorParser((selectors) => {
  selectors.walkClasses((classNode) => {
    if (classNode.value.startsWith(prefix)) {
      return
    }

    classNode.value = `${prefix}${classNode.value}`
    if (classNode.raws?.value) {
      delete classNode.raws.value
    }
  })
})

root.walkRules((rule) => {
  if (!rule.selector) {
    return
  }
  try {
    rule.selector = transformSelector.processSync(rule.selector)
  } catch {
    // Ignore selectors that can't be parsed; leave them untouched.
  }
})

await fs.writeFile(outputPath, root.toResult().css)
