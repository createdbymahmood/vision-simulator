import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import generatorModule from '@babel/generator'
import {parse as parseCode, type ParserPlugin} from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'
import type {Loader, Plugin as EsbuildPlugin} from 'esbuild'
import {parse as parseCss} from 'postcss'
import type {Plugin as VitePlugin} from 'vite'

const MAP_MANIFEST_RELATIVE_PATH = '.cache/classname-obfuscation-map.json'
const CSS_VAR_MAP_MANIFEST_RELATIVE_PATH =
  '.cache/css-variable-obfuscation-map.json'
const CLASS_HASH_SEED = 'vision-simulator-class-obfuscation-v1'
const CSS_VAR_HASH_SEED = 'vision-simulator-css-variable-obfuscation-v1'
const OBFUSCATED_CLASS_PREFIX = 'x'
const OBFUSCATED_CLASS_SEGMENT_SEPARATOR = '_'
const OBFUSCATED_CLASS_PRIMARY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const OBFUSCATED_CLASS_SECONDARY_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyz'
const OBFUSCATED_CLASS_TERTIARY_ALPHABET =
  'zyxwvutsrqponmlkjihgfedcba9876543210'
const OBFUSCATED_CSS_VAR_PREFIX = '--v'
const OBFUSCATED_CLASS_PRIMARY_SEGMENT_LENGTH = 6
const OBFUSCATED_CLASS_SECONDARY_SEGMENT_LENGTH = 6
const OBFUSCATED_CLASS_CHECKSUM_SEGMENT_LENGTH = 4
const COMPLEX_CLASS_TOKEN_PATTERN = /[-:[\]/!()%.]|\d/
const CSS_VARIABLE_TOKEN_PATTERN = /--[a-zA-Z0-9_-]+/g
const SUPPORTED_SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const CLASS_PROP_NAME_PATTERN = /class(name|names)?$/i
const CLASS_COMPOSER_CALL_NAMES = new Set([
  'cn',
  'cva',
  'clsx',
  'twMerge',
  'classNames',
  'cx',
])
const QUICK_CLASS_SIGNAL_PATTERN =
  /className|classNames|containerClassName|\bcn\(|\bcva\(|\bclsx\(|\btwMerge\(/u
const QUICK_CSS_VARIABLE_SIGNAL_PATTERN = /--[a-zA-Z0-9_-]+|var\(--/u
const CLASS_SELECTOR_PATTERN = /\.((?:\\.|[-_a-zA-Z0-9])+)/g
const CSS_HEX_ESCAPE_PATTERN = /\\([0-9a-fA-F]{1,6})(?:\s)?/g
const CSS_SIMPLE_ESCAPE_PATTERN = /\\(.)/g
const PROJECT_SOURCE_DIRECTORY = 'src'
const PRESERVED_CLASS_NAMES = new Set(['dark', 'light'])
const PRESERVED_CLASS_PREFIXES = Object.freeze(['size-'])
const PRESERVED_CSS_VARIABLE_PREFIXES = Object.freeze([
  '--radix-',
  '--bits-',
  '--reka-',
  '--kb-',
  '--ngp-',
])
const PARSER_PLUGINS: ParserPlugin[] = ['typescript', 'jsx']
const generate = (
  generatorModule as unknown as {
    default: typeof import('@babel/generator').default
  }
).default
const traverse = (
  traverseModule as unknown as {
    default: typeof import('@babel/traverse').default
  }
).default

interface ClassNameObfuscationContext {
  readonly classMap: ReadonlyMap<string, string>
  readonly classMapObject: Readonly<Record<string, string>>
  readonly cssVarMap: ReadonlyMap<string, string>
  readonly cssVarMapObject: Readonly<Record<string, string>>
  readonly projectRoot: string
}

interface SourceTransformResult {
  readonly code: string
  readonly changed: boolean
}

let cachedContext: ClassNameObfuscationContext | null = null

const getYarnCommand = () =>
  process.platform === 'win32' ? 'yarn.cmd' : 'yarn'

const resolveProjectRoot = (inputRoot: string) => path.resolve(inputRoot)

const decodeCssClassToken = (rawClassToken: string) => {
  const withHexEscapesDecoded = rawClassToken.replace(
    CSS_HEX_ESCAPE_PATTERN,
    (_, hexValue: string) => {
      const decodedCodePoint = Number.parseInt(hexValue, 16)
      return String.fromCodePoint(decodedCodePoint)
    },
  )

  return withHexEscapesDecoded.replace(CSS_SIMPLE_ESCAPE_PATTERN, '$1')
}

const replaceClassTokens = (
  value: string,
  classMap: ReadonlyMap<string, string>,
): {changed: boolean; value: string} => {
  let changed = false

  const nextValue = value.replace(/\S+/g, (classToken) => {
    const obfuscatedClassName = classMap.get(classToken)

    if (!obfuscatedClassName) {
      return classToken
    }

    changed = true
    return obfuscatedClassName
  })

  return {changed, value: nextValue}
}

const replaceCssVariableTokens = (
  value: string,
  cssVarMap: ReadonlyMap<string, string>,
): {changed: boolean; value: string} => {
  let changed = false

  CSS_VARIABLE_TOKEN_PATTERN.lastIndex = 0

  const nextValue = value.replace(CSS_VARIABLE_TOKEN_PATTERN, (cssVarToken) => {
    const obfuscatedCssVarName = cssVarMap.get(cssVarToken)

    if (!obfuscatedCssVarName) {
      return cssVarToken
    }

    changed = true
    return obfuscatedCssVarName
  })

  return {changed, value: nextValue}
}

const isPreservedCssVariable = (cssVariableName: string) =>
  PRESERVED_CSS_VARIABLE_PREFIXES.some((prefix) =>
    cssVariableName.startsWith(prefix),
  )

const isPreservedClassName = (className: string) => {
  if (PRESERVED_CLASS_NAMES.has(className)) {
    return true
  }

  return PRESERVED_CLASS_PREFIXES.some((prefix) => className.startsWith(prefix))
}

const tokenizeClassValue = (value: string) =>
  value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)

const canConservativelyTransformClassLiteral = (
  value: string,
  classMap: ReadonlyMap<string, string>,
) => {
  const tokens = tokenizeClassValue(value)

  if (tokens.length === 0) {
    return false
  }

  let hasComplexMappedToken = false

  for (const token of tokens) {
    if (isPreservedClassName(token)) {
      continue
    }

    if (!classMap.has(token)) {
      return false
    }

    if (COMPLEX_CLASS_TOKEN_PATTERN.test(token)) {
      hasComplexMappedToken = true
    }
  }

  return hasComplexMappedToken
}

const transformStringLiteralConservatively = (
  literalNode: t.StringLiteral,
  classMap: ReadonlyMap<string, string>,
) => {
  if (!canConservativelyTransformClassLiteral(literalNode.value, classMap)) {
    return false
  }

  const transformed = replaceClassTokens(literalNode.value, classMap)

  if (!transformed.changed) {
    return false
  }

  literalNode.value = transformed.value
  return true
}

const transformStringLiteralCssVariables = (
  literalNode: t.StringLiteral,
  cssVarMap: ReadonlyMap<string, string>,
) => {
  const transformed = replaceCssVariableTokens(literalNode.value, cssVarMap)

  if (!transformed.changed) {
    return false
  }

  literalNode.value = transformed.value
  return true
}

const getObjectPropertyKeyName = (property: t.ObjectProperty) => {
  if (property.computed) {
    return null
  }

  if (t.isIdentifier(property.key)) {
    return property.key.name
  }

  if (t.isStringLiteral(property.key)) {
    return property.key.value
  }

  return null
}

const isClassPropertyName = (propertyName: string) =>
  CLASS_PROP_NAME_PATTERN.test(propertyName)

const getCalleeName = (callee: t.Expression | t.V8IntrinsicIdentifier) => {
  if (t.isIdentifier(callee)) {
    return callee.name
  }

  if (!t.isMemberExpression(callee)) {
    return null
  }

  if (callee.computed) {
    return t.isStringLiteral(callee.property) ? callee.property.value : null
  }

  return t.isIdentifier(callee.property) ? callee.property.name : null
}

const isClassComposerCall = (node: t.CallExpression) => {
  const calleeName = getCalleeName(node.callee)
  return calleeName ? CLASS_COMPOSER_CALL_NAMES.has(calleeName) : false
}

const isCvaCall = (node: t.CallExpression) =>
  getCalleeName(node.callee) === 'cva'

const escapeTemplateLiteralRawValue = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

const transformTemplateLiteralValue = (
  templateNode: t.TemplateLiteral,
  classMap: ReadonlyMap<string, string>,
) => {
  let changed = false

  for (const templateElement of templateNode.quasis) {
    const cookedValue = templateElement.value.cooked

    if (cookedValue == null) {
      continue
    }

    const transformed = replaceClassTokens(cookedValue, classMap)

    if (!transformed.changed) {
      continue
    }

    changed = true
    templateElement.value.cooked = transformed.value
    templateElement.value.raw = escapeTemplateLiteralRawValue(transformed.value)
  }

  for (const expression of templateNode.expressions) {
    if (transformClassExpression(expression, classMap)) {
      changed = true
    }
  }

  return changed
}

const transformTemplateLiteralCssVariables = (
  templateNode: t.TemplateLiteral,
  cssVarMap: ReadonlyMap<string, string>,
) => {
  let changed = false

  for (const templateElement of templateNode.quasis) {
    const cookedValue = templateElement.value.cooked

    if (cookedValue == null) {
      continue
    }

    const transformed = replaceCssVariableTokens(cookedValue, cssVarMap)

    if (!transformed.changed) {
      continue
    }

    changed = true
    templateElement.value.cooked = transformed.value
    templateElement.value.raw = escapeTemplateLiteralRawValue(transformed.value)
  }

  return changed
}

const transformClassExpression = (
  expression: t.Node | null | undefined,
  classMap: ReadonlyMap<string, string>,
): boolean => {
  if (!expression) {
    return false
  }

  if (t.isStringLiteral(expression)) {
    const transformed = replaceClassTokens(expression.value, classMap)

    if (!transformed.changed) {
      return false
    }

    expression.value = transformed.value
    return true
  }

  if (t.isTemplateLiteral(expression)) {
    return transformTemplateLiteralValue(expression, classMap)
  }

  if (t.isConditionalExpression(expression)) {
    const consequentChanged = transformClassExpression(
      expression.consequent,
      classMap,
    )
    const alternateChanged = transformClassExpression(
      expression.alternate,
      classMap,
    )

    return consequentChanged || alternateChanged
  }

  if (t.isLogicalExpression(expression)) {
    const rightChanged = transformClassExpression(expression.right, classMap)

    if (expression.operator === '||' || expression.operator === '??') {
      const leftChanged = transformClassExpression(expression.left, classMap)
      return leftChanged || rightChanged
    }

    return rightChanged
  }

  if (t.isArrayExpression(expression)) {
    let changed = false

    for (const element of expression.elements) {
      if (element && transformClassExpression(element, classMap)) {
        changed = true
      }
    }

    return changed
  }

  if (t.isObjectExpression(expression)) {
    let changed = false

    for (const property of expression.properties) {
      if (t.isSpreadElement(property)) {
        if (transformClassExpression(property.argument, classMap)) {
          changed = true
        }

        continue
      }

      if (!t.isObjectProperty(property)) {
        continue
      }

      if (
        property.computed &&
        transformClassExpression(property.key, classMap)
      ) {
        changed = true
      }

      if (t.isStringLiteral(property.key)) {
        const transformed = replaceClassTokens(property.key.value, classMap)

        if (transformed.changed) {
          property.key.value = transformed.value
          changed = true
        }
      }
    }

    return changed
  }

  if (t.isParenthesizedExpression(expression)) {
    return transformClassExpression(expression.expression, classMap)
  }

  if (t.isTSAsExpression(expression)) {
    return transformClassExpression(expression.expression, classMap)
  }

  if (t.isTSTypeAssertion(expression)) {
    return transformClassExpression(expression.expression, classMap)
  }

  if (t.isTSNonNullExpression(expression)) {
    return transformClassExpression(expression.expression, classMap)
  }

  if (t.isCallExpression(expression) && isClassComposerCall(expression)) {
    const calleeName = getCalleeName(expression.callee)

    if (calleeName === 'cva') {
      return transformCvaCallExpression(expression, classMap)
    }

    let changed = false

    for (const argument of expression.arguments) {
      if (t.isSpreadElement(argument)) {
        if (transformClassExpression(argument.argument, classMap)) {
          changed = true
        }

        continue
      }

      if (transformClassExpression(argument, classMap)) {
        changed = true
      }
    }

    return changed
  }

  return false
}

const transformCvaVariantsExpression = (
  expression: t.Node,
  classMap: ReadonlyMap<string, string>,
) => {
  if (!t.isObjectExpression(expression)) {
    return false
  }

  let changed = false

  for (const variantGroupProperty of expression.properties) {
    if (!t.isObjectProperty(variantGroupProperty)) {
      continue
    }

    if (!t.isObjectExpression(variantGroupProperty.value)) {
      continue
    }

    for (const variantOptionProperty of variantGroupProperty.value.properties) {
      if (!t.isObjectProperty(variantOptionProperty)) {
        continue
      }

      if (transformClassExpression(variantOptionProperty.value, classMap)) {
        changed = true
      }
    }
  }

  return changed
}

const transformCvaCompoundVariantsExpression = (
  expression: t.Node,
  classMap: ReadonlyMap<string, string>,
) => {
  if (!t.isArrayExpression(expression)) {
    return false
  }

  let changed = false

  for (const element of expression.elements) {
    if (!element || !t.isObjectExpression(element)) {
      continue
    }

    for (const property of element.properties) {
      if (!t.isObjectProperty(property)) {
        continue
      }

      const keyName = getObjectPropertyKeyName(property)

      if (!keyName || !isClassPropertyName(keyName)) {
        continue
      }

      if (transformClassExpression(property.value, classMap)) {
        changed = true
      }
    }
  }

  return changed
}

const transformCvaConfigExpression = (
  expression: t.Node,
  classMap: ReadonlyMap<string, string>,
) => {
  if (!t.isObjectExpression(expression)) {
    return false
  }

  let changed = false

  for (const property of expression.properties) {
    if (!t.isObjectProperty(property)) {
      continue
    }

    const keyName = getObjectPropertyKeyName(property)

    if (!keyName) {
      continue
    }

    if (keyName === 'variants') {
      if (transformCvaVariantsExpression(property.value, classMap)) {
        changed = true
      }

      continue
    }

    if (keyName === 'compoundVariants') {
      if (transformCvaCompoundVariantsExpression(property.value, classMap)) {
        changed = true
      }

      continue
    }

    if (isClassPropertyName(keyName)) {
      if (transformClassExpression(property.value, classMap)) {
        changed = true
      }
    }
  }

  return changed
}

const transformCvaCallExpression = (
  expression: t.CallExpression,
  classMap: ReadonlyMap<string, string>,
) => {
  let changed = false

  const firstArgument = expression.arguments[0]

  if (firstArgument && !t.isSpreadElement(firstArgument)) {
    if (transformClassExpression(firstArgument, classMap)) {
      changed = true
    }
  }

  const secondArgument = expression.arguments[1]

  if (secondArgument && !t.isSpreadElement(secondArgument)) {
    if (transformCvaConfigExpression(secondArgument, classMap)) {
      changed = true
    }
  }

  for (const trailingArgument of expression.arguments.slice(2)) {
    if (t.isSpreadElement(trailingArgument)) {
      if (transformClassExpression(trailingArgument.argument, classMap)) {
        changed = true
      }

      continue
    }

    if (transformClassExpression(trailingArgument, classMap)) {
      changed = true
    }
  }

  return changed
}

const isWithinProjectSource = (
  projectRoot: string,
  absoluteFilePath: string,
) => {
  const sourceRoot = path.join(projectRoot, PROJECT_SOURCE_DIRECTORY)
  const relativePath = path.relative(sourceRoot, absoluteFilePath)

  if (relativePath.length === 0) {
    return true
  }

  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}

const isImportExportSourceLiteral = (
  path: import('@babel/traverse').NodePath<t.StringLiteral>,
) => {
  const parentNode = path.parent

  if (t.isImportDeclaration(parentNode) && parentNode.source === path.node) {
    return true
  }

  if (t.isExportAllDeclaration(parentNode) && parentNode.source === path.node) {
    return true
  }

  if (
    t.isExportNamedDeclaration(parentNode) &&
    parentNode.source === path.node
  ) {
    return true
  }

  return false
}

const stripQueryString = (id: string) => id.split('?')[0]

const isTransformableSourceFile = (projectRoot: string, id: string) => {
  if (id.startsWith('\u0000')) {
    return false
  }

  const filePath = stripQueryString(id)

  if (filePath.includes(`${path.sep}node_modules${path.sep}`)) {
    return false
  }

  if (!SUPPORTED_SOURCE_EXTENSIONS.has(path.extname(filePath))) {
    return false
  }

  return isWithinProjectSource(projectRoot, filePath)
}

const extractClassesFromSelector = (selector: string) => {
  const selectorClasses = new Set<string>()
  let match: RegExpExecArray | null

  CLASS_SELECTOR_PATTERN.lastIndex = 0

  while ((match = CLASS_SELECTOR_PATTERN.exec(selector)) !== null) {
    const decodedClassName = decodeCssClassToken(match[1])

    if (decodedClassName.length === 0) {
      continue
    }

    selectorClasses.add(decodedClassName)
  }

  return selectorClasses
}

const extractClassNamesFromCss = (cssCode: string) => {
  const classNames = new Set<string>()
  const cssAst = parseCss(cssCode)

  cssAst.walkRules((rule) => {
    const selector = rule.selector

    if (!selector) {
      return
    }

    for (const className of extractClassesFromSelector(selector)) {
      classNames.add(className)
    }
  })

  return classNames
}

const extractCssVariablesFromValue = (value: string) => {
  const cssVariables = new Set<string>()
  let match: RegExpExecArray | null

  CSS_VARIABLE_TOKEN_PATTERN.lastIndex = 0

  while ((match = CSS_VARIABLE_TOKEN_PATTERN.exec(value)) !== null) {
    const cssVariableName = match[0]

    if (cssVariableName.length <= 2) {
      continue
    }

    cssVariables.add(cssVariableName)
  }

  return cssVariables
}

const extractCssVariablesFromCss = (cssCode: string) => {
  const cssVariables = new Set<string>()
  const cssAst = parseCss(cssCode)

  cssAst.walkDecls((declaration) => {
    if (declaration.prop.startsWith('--')) {
      cssVariables.add(declaration.prop)
    }

    for (const cssVariableName of extractCssVariablesFromValue(
      declaration.value,
    )) {
      cssVariables.add(cssVariableName)
    }
  })

  cssAst.walkAtRules((atRule) => {
    for (const cssVariableName of extractCssVariablesFromValue(atRule.params)) {
      cssVariables.add(cssVariableName)
    }
  })

  return cssVariables
}

const rotateAlphabet = (alphabet: string, shift: number) => {
  const normalizedShift =
    ((shift % alphabet.length) + alphabet.length) % alphabet.length

  if (normalizedShift === 0) {
    return alphabet
  }

  return `${alphabet.slice(normalizedShift)}${alphabet.slice(0, normalizedShift)}`
}

const createHashSegment = (
  hash: Buffer,
  alphabet: string,
  length: number,
  offset: number,
  stride: number,
  salt: number,
) => {
  let segment = ''

  for (let index = 0; index < length; index += 1) {
    const hashIndex = (offset + index * stride) % hash.length
    const pairedHashIndex = (hashIndex + 13) % hash.length
    const mixedValue =
      hash[hashIndex] ^ hash[pairedHashIndex] ^ ((salt + index * 17) & 0xff)
    const alphabetIndex = mixedValue % alphabet.length
    segment += alphabet[alphabetIndex]
  }

  return segment
}

const createObfuscatedClassName = (className: string, attempt: number) => {
  const hash = createHash('sha256')
    .update(`${CLASS_HASH_SEED}:${className}:${attempt}`)
    .digest()
  const rotationSeed = hash[0] + hash[3] + className.length + attempt * 11
  const primaryAlphabet = rotateAlphabet(
    OBFUSCATED_CLASS_PRIMARY_ALPHABET,
    rotationSeed,
  )
  const secondaryAlphabet = rotateAlphabet(
    OBFUSCATED_CLASS_SECONDARY_ALPHABET,
    hash[7] + className.length * 3 + attempt * 5,
  )
  const tertiaryAlphabet = rotateAlphabet(
    OBFUSCATED_CLASS_TERTIARY_ALPHABET,
    hash[15] + className.length * 7 + attempt * 13,
  )
  const primarySegment = createHashSegment(
    hash,
    primaryAlphabet,
    OBFUSCATED_CLASS_PRIMARY_SEGMENT_LENGTH,
    1,
    3,
    className.length + attempt,
  )
  const secondarySegment = createHashSegment(
    hash,
    secondaryAlphabet,
    OBFUSCATED_CLASS_SECONDARY_SEGMENT_LENGTH,
    5,
    5,
    className.length * 3 + attempt * 7,
  )
  const checksumSegment = createHashSegment(
    hash,
    tertiaryAlphabet,
    OBFUSCATED_CLASS_CHECKSUM_SEGMENT_LENGTH,
    11,
    7,
    className.length * 9 + attempt * 17,
  )

  return [
    `${OBFUSCATED_CLASS_PREFIX}${primarySegment}`,
    secondarySegment,
    checksumSegment,
  ].join(OBFUSCATED_CLASS_SEGMENT_SEPARATOR)
}

const createObfuscatedCssVariableName = (
  cssVariableName: string,
  attempt: number,
) => {
  const hash = createHash('sha256')
    .update(`${CSS_VAR_HASH_SEED}:${cssVariableName}:${attempt}`)
    .digest()
  const rotationSeed = hash[2] + hash[9] + cssVariableName.length + attempt * 13
  const primaryAlphabet = rotateAlphabet(
    OBFUSCATED_CLASS_PRIMARY_ALPHABET,
    rotationSeed,
  )
  const secondaryAlphabet = rotateAlphabet(
    OBFUSCATED_CLASS_SECONDARY_ALPHABET,
    hash[11] + cssVariableName.length * 5 + attempt * 7,
  )
  const tertiaryAlphabet = rotateAlphabet(
    OBFUSCATED_CLASS_TERTIARY_ALPHABET,
    hash[19] + cssVariableName.length * 11 + attempt * 17,
  )
  const primarySegment = createHashSegment(
    hash,
    primaryAlphabet,
    OBFUSCATED_CLASS_PRIMARY_SEGMENT_LENGTH,
    2,
    5,
    cssVariableName.length + attempt * 3,
  )
  const secondarySegment = createHashSegment(
    hash,
    secondaryAlphabet,
    OBFUSCATED_CLASS_SECONDARY_SEGMENT_LENGTH,
    7,
    7,
    cssVariableName.length * 7 + attempt * 11,
  )
  const checksumSegment = createHashSegment(
    hash,
    tertiaryAlphabet,
    OBFUSCATED_CLASS_CHECKSUM_SEGMENT_LENGTH,
    13,
    11,
    cssVariableName.length * 13 + attempt * 19,
  )

  return [
    `${OBFUSCATED_CSS_VAR_PREFIX}${primarySegment}`,
    secondarySegment,
    checksumSegment,
  ].join(OBFUSCATED_CLASS_SEGMENT_SEPARATOR)
}

const createClassMap = (classNames: Iterable<string>) => {
  const map = new Map<string, string>()
  const occupiedClassNames = new Set<string>()

  for (const className of [...classNames].sort((left, right) =>
    left.localeCompare(right),
  )) {
    if (isPreservedClassName(className)) {
      continue
    }

    let attempt = 0

    while (true) {
      const obfuscatedClassName = createObfuscatedClassName(className, attempt)

      if (!occupiedClassNames.has(obfuscatedClassName)) {
        occupiedClassNames.add(obfuscatedClassName)
        map.set(className, obfuscatedClassName)
        break
      }

      attempt += 1
    }
  }

  return map
}

const createCssVarMap = (cssVariables: Iterable<string>) => {
  const map = new Map<string, string>()
  const occupiedCssVariables = new Set<string>()

  for (const cssVariableName of [...cssVariables].sort((left, right) =>
    left.localeCompare(right),
  )) {
    if (isPreservedCssVariable(cssVariableName)) {
      continue
    }

    let attempt = 0

    while (true) {
      const obfuscatedCssVariableName = createObfuscatedCssVariableName(
        cssVariableName,
        attempt,
      )

      if (!occupiedCssVariables.has(obfuscatedCssVariableName)) {
        occupiedCssVariables.add(obfuscatedCssVariableName)
        map.set(cssVariableName, obfuscatedCssVariableName)
        break
      }

      attempt += 1
    }
  }

  return map
}

const mapToSortedObject = (classMap: ReadonlyMap<string, string>) => {
  const sortedEntries = [...classMap.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )

  return Object.freeze(Object.fromEntries(sortedEntries))
}

const writeObfuscationMapManifest = (
  projectRoot: string,
  mapRelativePath: string,
  obfuscationMap: ReadonlyMap<string, string>,
) => {
  const manifestPath = path.join(projectRoot, mapRelativePath)
  const manifestDirectoryPath = path.dirname(manifestPath)

  if (!fs.existsSync(manifestDirectoryPath)) {
    fs.mkdirSync(manifestDirectoryPath, {recursive: true})
  }

  const mapAsObject = mapToSortedObject(obfuscationMap)
  fs.writeFileSync(manifestPath, JSON.stringify(mapAsObject, null, 2), 'utf8')
}

const createTailwindPrebuildCss = (projectRoot: string) => {
  const temporaryDirectoryPath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'classname-obfuscation-'),
  )
  const outputCssPath = path.join(temporaryDirectoryPath, 'prebuild.css')
  const tailwindCommandResult = spawnSync(
    getYarnCommand(),
    [
      '-s',
      'tailwindcss',
      '-i',
      'src/index.css',
      '-o',
      outputCssPath,
      '--content',
      './src/**/*.{ts,tsx,js,jsx}',
      '--minify',
    ],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    },
  )

  if (tailwindCommandResult.status !== 0) {
    const stderr = tailwindCommandResult.stderr?.trim()
    const stdout = tailwindCommandResult.stdout?.trim()
    const failureMessage = [stderr, stdout]
      .filter((line): line is string => Boolean(line))
      .join('\n')

    throw new Error(
      `Failed to generate class obfuscation prebuild CSS.\n${failureMessage}`,
    )
  }

  const cssCode = fs.readFileSync(outputCssPath, 'utf8')

  fs.rmSync(temporaryDirectoryPath, {
    force: true,
    recursive: true,
  })

  return cssCode
}

const buildClassNameObfuscationContext = (projectRoot: string) => {
  const generatedCss = createTailwindPrebuildCss(projectRoot)
  const discoveredClassNames = extractClassNamesFromCss(generatedCss)
  const discoveredCssVariables = extractCssVariablesFromCss(generatedCss)
  const classMap = createClassMap(discoveredClassNames)
  const cssVarMap = createCssVarMap(discoveredCssVariables)

  writeObfuscationMapManifest(projectRoot, MAP_MANIFEST_RELATIVE_PATH, classMap)
  writeObfuscationMapManifest(
    projectRoot,
    CSS_VAR_MAP_MANIFEST_RELATIVE_PATH,
    cssVarMap,
  )

  return {
    classMap,
    classMapObject: mapToSortedObject(classMap),
    cssVarMap,
    cssVarMapObject: mapToSortedObject(cssVarMap),
    projectRoot,
  } satisfies ClassNameObfuscationContext
}

const replaceSelectorClassNames = (
  selector: string,
  classMap: ReadonlyMap<string, string>,
) => {
  CLASS_SELECTOR_PATTERN.lastIndex = 0

  return selector.replace(
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
}

export const obfuscateCssCode = (
  cssCode: string,
  classMap: ReadonlyMap<string, string>,
  cssVarMap: ReadonlyMap<string, string>,
) => {
  const cssAst = parseCss(cssCode)

  cssAst.walkRules((rule) => {
    if (!rule.selector) {
      return
    }

    const selectorWithObfuscatedClasses = replaceSelectorClassNames(
      rule.selector,
      classMap,
    )
    const selectorWithObfuscatedCssVars = replaceCssVariableTokens(
      selectorWithObfuscatedClasses,
      cssVarMap,
    )

    rule.selector = selectorWithObfuscatedCssVars.value
  })

  cssAst.walkDecls((declaration) => {
    if (declaration.prop.startsWith('--')) {
      const obfuscatedPropertyName = cssVarMap.get(declaration.prop)

      if (obfuscatedPropertyName) {
        declaration.prop = obfuscatedPropertyName
      }
    }

    const transformedValue = replaceCssVariableTokens(
      declaration.value,
      cssVarMap,
    )

    if (transformedValue.changed) {
      declaration.value = transformedValue.value
    }
  })

  cssAst.walkAtRules((atRule) => {
    if (!atRule.params) {
      return
    }

    const transformedParams = replaceCssVariableTokens(atRule.params, cssVarMap)

    if (transformedParams.changed) {
      atRule.params = transformedParams.value
    }
  })

  return cssAst.toString()
}

export const getClassNameObfuscationContext = (inputRoot = process.cwd()) => {
  const projectRoot = resolveProjectRoot(inputRoot)

  if (cachedContext && cachedContext.projectRoot === projectRoot) {
    return cachedContext
  }

  cachedContext = buildClassNameObfuscationContext(projectRoot)
  return cachedContext
}

export const transformSourceClassNames = (
  sourceCode: string,
  sourcePath: string,
  classMap: ReadonlyMap<string, string>,
  cssVarMap: ReadonlyMap<string, string>,
): SourceTransformResult => {
  if (
    !QUICK_CLASS_SIGNAL_PATTERN.test(sourceCode) &&
    !QUICK_CSS_VARIABLE_SIGNAL_PATTERN.test(sourceCode)
  ) {
    return {
      changed: false,
      code: sourceCode,
    }
  }

  const parsedAst = parseCode(sourceCode, {
    errorRecovery: true,
    plugins: PARSER_PLUGINS,
    sourceType: 'module',
  })

  let changed = false

  traverse(parsedAst, {
    JSXAttribute(path) {
      if (!t.isJSXIdentifier(path.node.name)) {
        return
      }

      if (!isClassPropertyName(path.node.name.name)) {
        return
      }

      if (!path.node.value) {
        return
      }

      if (t.isStringLiteral(path.node.value)) {
        if (transformClassExpression(path.node.value, classMap)) {
          changed = true
        }

        return
      }

      if (
        t.isJSXExpressionContainer(path.node.value) &&
        transformClassExpression(path.node.value.expression, classMap)
      ) {
        changed = true
      }
    },

    ObjectProperty(path) {
      const keyName = getObjectPropertyKeyName(path.node)

      if (!keyName || !isClassPropertyName(keyName)) {
        return
      }

      if (transformClassExpression(path.node.value, classMap)) {
        changed = true
      }
    },

    VariableDeclarator(path) {
      if (!t.isIdentifier(path.node.id)) {
        return
      }

      if (!/class/i.test(path.node.id.name)) {
        return
      }

      if (transformClassExpression(path.node.init, classMap)) {
        changed = true
      }
    },

    CallExpression(path) {
      if (!isClassComposerCall(path.node)) {
        return
      }

      if (isCvaCall(path.node)) {
        if (transformCvaCallExpression(path.node, classMap)) {
          changed = true
        }

        return
      }

      for (const argument of path.node.arguments) {
        if (t.isSpreadElement(argument)) {
          if (transformClassExpression(argument.argument, classMap)) {
            changed = true
          }

          continue
        }

        if (transformClassExpression(argument, classMap)) {
          changed = true
        }
      }
    },

    StringLiteral(path) {
      if (isImportExportSourceLiteral(path)) {
        return
      }

      let pathChanged = false

      if (transformStringLiteralConservatively(path.node, classMap)) {
        pathChanged = true
      }

      if (transformStringLiteralCssVariables(path.node, cssVarMap)) {
        pathChanged = true
      }

      if (pathChanged) {
        changed = true
      }
    },

    TemplateLiteral(path) {
      if (transformTemplateLiteralCssVariables(path.node, cssVarMap)) {
        changed = true
      }
    },
  })

  if (!changed) {
    return {
      changed: false,
      code: sourceCode,
    }
  }

  const generatedOutput = generate(
    parsedAst,
    {
      sourceFileName: sourcePath,
      sourceMaps: true,
    },
    sourceCode,
  )

  return {
    changed: true,
    code: generatedOutput.code,
  }
}

export const createViteClassNameObfuscationPlugin = (): VitePlugin => {
  let context: ClassNameObfuscationContext | null = null

  return {
    apply: 'build',
    enforce: 'pre',
    name: 'class-name-obfuscation',

    buildStart() {
      context = getClassNameObfuscationContext(process.cwd())
    },

    transform(sourceCode, id) {
      if (!context || !isTransformableSourceFile(context.projectRoot, id)) {
        return null
      }

      const sourcePath = stripQueryString(id)
      const transformed = transformSourceClassNames(
        sourceCode,
        sourcePath,
        context.classMap,
        context.cssVarMap,
      )

      if (!transformed.changed) {
        return null
      }

      return {
        code: transformed.code,
      }
    },

    generateBundle(_, bundle) {
      if (!context) {
        return
      }

      for (const outputChunk of Object.values(bundle)) {
        if (outputChunk.type !== 'asset') {
          continue
        }

        if (!outputChunk.fileName.endsWith('.css')) {
          continue
        }

        const cssCode =
          typeof outputChunk.source === 'string'
            ? outputChunk.source
            : Buffer.from(outputChunk.source).toString('utf8')

        outputChunk.source = obfuscateCssCode(
          cssCode,
          context.classMap,
          context.cssVarMap,
        )
      }
    },
  }
}

const resolveLoaderFromPath = (filePath: string): Loader | null => {
  const extension = path.extname(filePath)

  if (!SUPPORTED_SOURCE_EXTENSIONS.has(extension)) {
    return null
  }

  const loaderMap: Readonly<Record<string, Loader>> = {
    '.js': 'js',
    '.jsx': 'jsx',
    '.ts': 'ts',
    '.tsx': 'tsx',
  }

  return loaderMap[extension] ?? null
}

export const createEsbuildClassNameObfuscationPlugin = (
  context: ClassNameObfuscationContext,
): EsbuildPlugin => ({
  name: 'class-name-obfuscation',

  setup(build) {
    build.onLoad(
      {
        filter: /\.[jt]sx?$/,
      },
      async ({path: filePath}) => {
        if (!isWithinProjectSource(context.projectRoot, filePath)) {
          return null
        }

        const loader = resolveLoaderFromPath(filePath)

        if (!loader) {
          return null
        }

        const sourceCode = await fs.promises.readFile(filePath, 'utf8')
        const transformed = transformSourceClassNames(
          sourceCode,
          filePath,
          context.classMap,
          context.cssVarMap,
        )

        if (!transformed.changed) {
          return null
        }

        return {
          contents: transformed.code,
          loader,
          resolveDir: path.dirname(filePath),
        }
      },
    )
  },
})

export const getClassMapManifestPath = (inputRoot = process.cwd()) =>
  path.join(resolveProjectRoot(inputRoot), MAP_MANIFEST_RELATIVE_PATH)

export const getCssVarMapManifestPath = (inputRoot = process.cwd()) =>
  path.join(resolveProjectRoot(inputRoot), CSS_VAR_MAP_MANIFEST_RELATIVE_PATH)

export const readClassMapFromManifest = (inputRoot = process.cwd()) => {
  const manifestPath = getClassMapManifestPath(inputRoot)

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Class name obfuscation manifest was not found at ${manifestPath}.`,
    )
  }

  const manifestCode = fs.readFileSync(manifestPath, 'utf8')
  const parsedManifest = JSON.parse(manifestCode) as Record<string, string>

  return new Map<string, string>(Object.entries(parsedManifest))
}

export const readCssVarMapFromManifest = (inputRoot = process.cwd()) => {
  const manifestPath = getCssVarMapManifestPath(inputRoot)

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `CSS variable obfuscation manifest was not found at ${manifestPath}.`,
    )
  }

  const manifestCode = fs.readFileSync(manifestPath, 'utf8')
  const parsedManifest = JSON.parse(manifestCode) as Record<string, string>

  return new Map<string, string>(Object.entries(parsedManifest))
}

export const obfuscateCssFile = (
  cssFilePath: string,
  classMap: ReadonlyMap<string, string>,
  cssVarMap: ReadonlyMap<string, string>,
) => {
  const cssCode = fs.readFileSync(cssFilePath, 'utf8')
  const obfuscatedCss = obfuscateCssCode(cssCode, classMap, cssVarMap)

  fs.writeFileSync(cssFilePath, obfuscatedCss, 'utf8')
}
