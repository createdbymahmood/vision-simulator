import fs from 'node:fs'
import path from 'node:path'
import {parse as parseCss} from 'postcss'

const manifestPath = path.resolve(
  process.cwd(),
  '.cache/classname-obfuscation-map.json',
)
const targetPaths =
  process.argv.length > 2
    ? process.argv
        .slice(2)
        .map((targetPath) => path.resolve(process.cwd(), targetPath))
    : [path.resolve(process.cwd(), 'dist/styles.css')]

const CLASS_SELECTOR_PATTERN = /\.((?:\\.|[\w\-])+)/g
const CSS_HEX_ESCAPE_PATTERN = /\\([0-9a-f]{1,6})\s?/gi
const CSS_SIMPLE_ESCAPE_PATTERN = /\\(.)/g

const decodeCssClassToken = (rawClassToken) => {
  const withHexEscapesDecoded = rawClassToken.replace(
    CSS_HEX_ESCAPE_PATTERN,
    (_, hexValue) => {
      const decodedCodePoint = Number.parseInt(hexValue, 16)
      return String.fromCodePoint(decodedCodePoint)
    },
  )

  return withHexEscapesDecoded.replace(CSS_SIMPLE_ESCAPE_PATTERN, '$1')
}

const obfuscateCssCode = (cssCode, classMap) => {
  const cssAst = parseCss(cssCode)

  cssAst.walkRules((rule) => {
    if (!rule.selector) {
      return
    }

    CLASS_SELECTOR_PATTERN.lastIndex = 0

    rule.selector = rule.selector.replace(
      CLASS_SELECTOR_PATTERN,
      (fullMatch, rawClassToken) => {
        const decodedClassName = decodeCssClassToken(rawClassToken)
        const obfuscatedClassName = classMap.get(decodedClassName)

        if (!obfuscatedClassName) {
          return fullMatch
        }

        return `.${obfuscatedClassName}`
      },
    )
  })

  return cssAst.toString()
}

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Class map manifest is missing at ${manifestPath}`)
}

const manifestCode = fs.readFileSync(manifestPath, 'utf8')
const classMapEntries = Object.entries(JSON.parse(manifestCode))
const classMap = new Map(classMapEntries)

for (const cssFilePath of targetPaths) {
  if (!fs.existsSync(cssFilePath)) {
    throw new Error(`CSS file does not exist: ${cssFilePath}`)
  }

  const cssCode = fs.readFileSync(cssFilePath, 'utf8')
  const obfuscatedCssCode = obfuscateCssCode(cssCode, classMap)

  fs.writeFileSync(cssFilePath, obfuscatedCssCode, 'utf8')
}
