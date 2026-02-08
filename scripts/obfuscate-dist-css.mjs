import fs from 'node:fs'
import path from 'node:path'
import {parse as parseCss} from 'postcss'

const classManifestPath = path.resolve(
  process.cwd(),
  '.cache/classname-obfuscation-map.json',
)
const cssVarManifestPath = path.resolve(
  process.cwd(),
  '.cache/css-variable-obfuscation-map.json',
)
const targetPaths =
  process.argv.length > 2
    ? process.argv
        .slice(2)
        .map((targetPath) => path.resolve(process.cwd(), targetPath))
    : [path.resolve(process.cwd(), 'dist/styles.css')]

// eslint-disable-next-line no-useless-escape
const CLASS_SELECTOR_PATTERN = /\.((?:\\.|[\w\-])+)/g
const CSS_HEX_ESCAPE_PATTERN = /\\([0-9a-f]{1,6})\s?/gi
const CSS_SIMPLE_ESCAPE_PATTERN = /\\(.)/g
const CSS_VARIABLE_TOKEN_PATTERN = /--[\w-]+/g

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

const replaceCssVariableTokens = (value, cssVarMap) => {
  CSS_VARIABLE_TOKEN_PATTERN.lastIndex = 0

  return value.replace(CSS_VARIABLE_TOKEN_PATTERN, (cssVarToken) => {
    const obfuscatedCssVarName = cssVarMap.get(cssVarToken)
    return obfuscatedCssVarName ?? cssVarToken
  })
}

const obfuscateCssCode = (cssCode, classMap, cssVarMap) => {
  const cssAst = parseCss(cssCode)

  cssAst.walkRules((rule) => {
    if (!rule.selector) {
      return
    }

    CLASS_SELECTOR_PATTERN.lastIndex = 0

    const selectorWithObfuscatedClasses = rule.selector.replace(
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

    rule.selector = replaceCssVariableTokens(
      selectorWithObfuscatedClasses,
      cssVarMap,
    )
  })

  cssAst.walkDecls((declaration) => {
    if (declaration.prop.startsWith('--')) {
      const obfuscatedPropertyName = cssVarMap.get(declaration.prop)

      if (obfuscatedPropertyName) {
        declaration.prop = obfuscatedPropertyName
      }
    }

    declaration.value = replaceCssVariableTokens(declaration.value, cssVarMap)
  })

  cssAst.walkAtRules((atRule) => {
    if (!atRule.params) {
      return
    }

    atRule.params = replaceCssVariableTokens(atRule.params, cssVarMap)
  })

  cssAst.walkAtRules('layer', (layerAtRule) => {
    if (!layerAtRule.nodes || layerAtRule.nodes.length === 0) {
      layerAtRule.remove()
      return
    }

    layerAtRule.replaceWith(...layerAtRule.nodes)
  })

  return cssAst.toString()
}

if (!fs.existsSync(classManifestPath)) {
  throw new Error(`Class map manifest is missing at ${classManifestPath}`)
}

if (!fs.existsSync(cssVarManifestPath)) {
  throw new Error(
    `CSS variable map manifest is missing at ${cssVarManifestPath}`,
  )
}

const classManifestCode = fs.readFileSync(classManifestPath, 'utf8')
const classMapEntries = Object.entries(JSON.parse(classManifestCode))
const classMap = new Map(classMapEntries)
const cssVarManifestCode = fs.readFileSync(cssVarManifestPath, 'utf8')
const cssVarMapEntries = Object.entries(JSON.parse(cssVarManifestCode))
const cssVarMap = new Map(cssVarMapEntries)

for (const cssFilePath of targetPaths) {
  if (!fs.existsSync(cssFilePath)) {
    throw new Error(`CSS file does not exist: ${cssFilePath}`)
  }

  const cssCode = fs.readFileSync(cssFilePath, 'utf8')
  const obfuscatedCssCode = obfuscateCssCode(cssCode, classMap, cssVarMap)

  fs.writeFileSync(cssFilePath, obfuscatedCssCode, 'utf8')
}
