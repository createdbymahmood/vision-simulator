import {parse as parseCode} from '@babel/parser'
import traverseModule from '@babel/traverse'
import fs from 'node:fs'
import path from 'node:path'

const CLASS_MAP_PATH = path.resolve(
  process.cwd(),
  '.cache/classname-obfuscation-map.json',
)
const DIST_JS_PATH = path.resolve(process.cwd(), 'dist/index.js')
const DIST_CSS_PATH = path.resolve(process.cwd(), 'dist/styles.css')
const COMPLEX_CLASS_TOKEN_PATTERN = /[\d!%()\-./:[\]]/
const OBFUSCATED_CLASS_PATTERN = /\bx[0-9a-z]{6}_[0-9a-z]{6}_[0-9a-z]{4}\b/g

const traverse =
  /** @type {{default: typeof import('@babel/traverse').default}} */ (
    traverseModule
  ).default

const readTextFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`)
  }

  return fs.readFileSync(filePath, 'utf8')
}

const tokenize = (value) =>
  value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)

const collectComplexOriginalClassTokens = (jsCode, classSet) => {
  const ast = parseCode(jsCode, {
    sourceType: 'module',
    plugins: ['jsx'],
  })

  /** @type {Map<string, string[]>} */
  const findings = new Map()

  traverse(ast, {
    StringLiteral(_path) {
      const tokens = tokenize(_path.node.value)

      for (const token of tokens) {
        if (!classSet.has(token) || !COMPLEX_CLASS_TOKEN_PATTERN.test(token)) {
          continue
        }

        if (!findings.has(token)) {
          findings.set(token, [])
        }

        const location = _path.node.loc?.start
        const formattedLocation = location
          ? `line ${location.line}`
          : 'unknown line'

        if (findings.get(token).length < 3) {
          findings.get(token).push(formattedLocation)
        }
      }
    },
  })

  return findings
}

const collectObfuscatedClassNamesFromJs = (jsCode) => {
  const classNames = new Set()
  let match

  OBFUSCATED_CLASS_PATTERN.lastIndex = 0

  while ((match = OBFUSCATED_CLASS_PATTERN.exec(jsCode)) !== null) {
    classNames.add(match[0])
  }

  return classNames
}

const collectObfuscatedClassNamesFromCss = (cssCode) => {
  const classNames = new Set()
  const selectorPattern = /\.(x[0-9a-z]{6}_[0-9a-z]{6}_[0-9a-z]{4})/g
  let match

  selectorPattern.lastIndex = 0

  while ((match = selectorPattern.exec(cssCode)) !== null) {
    classNames.add(match[1])
  }

  return classNames
}

const classMapCode = readTextFile(CLASS_MAP_PATH)
const jsCode = readTextFile(DIST_JS_PATH)
const cssCode = readTextFile(DIST_CSS_PATH)
const classMap = JSON.parse(classMapCode)
const classSet = new Set(Object.keys(classMap))

const complexOriginalTokens = collectComplexOriginalClassTokens(
  jsCode,
  classSet,
)

if (complexOriginalTokens.size > 0) {
  const details = [...complexOriginalTokens.entries()]
    .slice(0, 40)
    .map(([className, locations]) => `${className} (${locations.join(', ')})`)
    .join('\n')

  throw new Error(
    [
      'Classname obfuscation verification failed.',
      'Complex original class tokens are still present in dist/index.js:',
      details,
    ].join('\n'),
  )
}

const jsObfuscatedClassNames = collectObfuscatedClassNamesFromJs(jsCode)
const cssObfuscatedClassNames = collectObfuscatedClassNamesFromCss(cssCode)
const missingCssClasses = [...jsObfuscatedClassNames].filter(
  (className) => !cssObfuscatedClassNames.has(className),
)

if (missingCssClasses.length > 0) {
  throw new Error(
    [
      'Classname obfuscation verification failed.',
      'Some obfuscated class names used in dist/index.js are missing in dist/styles.css:',
      ...missingCssClasses.slice(0, 50),
    ].join('\n'),
  )
}

if (/@layer\b/.test(cssCode)) {
  throw new Error(
    [
      'Classname obfuscation verification failed.',
      'dist/styles.css still contains @layer directives.',
      'This breaks Tailwind v3 consumers when imported through PostCSS/Tailwind pipelines.',
    ].join('\n'),
  )
}

console.log(
  `Classname obfuscation verified: ${jsObfuscatedClassNames.size} JS classes, ${cssObfuscatedClassNames.size} CSS classes.`,
)
