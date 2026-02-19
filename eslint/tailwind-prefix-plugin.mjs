/* eslint-disable complexity, max-lines-per-function, no-use-before-define */
import fs from 'node:fs'
import path from 'node:path'

const CLASS_ATTRIBUTE_NAMES = new Set(['class', 'className'])
const CLASS_HELPER_NAMES = new Set(['clsx', 'cn', 'twMerge'])
const CLASS_VARIABLE_NAME_PATTERN = /(?:^|_)(?:class|classname)(?:$|_)/i
const EXTRA_IGNORED_CLASS_NAMES = new Set(['toaster'])
const NON_CLASS_TOKENS = new Set([
  ',',
  ';',
  ':',
  '!=',
  '!==',
  '?',
  '/',
  '//',
  '&&',
  '==',
  '===',
  '=>',
  '|',
  '||',
])
const IGNORED_DIRS = new Set(['.git', 'dist', 'node_modules'])
const DEFAULT_PREFIX = 'tw'
const DEFAULT_KNOWN_PREFIXES = ['tw', 'vs']
const CLASS_ATTRIBUTE_SELECTOR_PATTERN =
  /\[class\s*(\*=|~=|\|=|\^=|\$=|=)\s*(["'])([^"'\]]+)\2\]/g

const readCssClassNames = (rootDir) => {
  const cssClasses = new Set()
  const sourceDir = path.join(rootDir, 'src')

  if (!fs.existsSync(sourceDir)) {
    return cssClasses
  }

  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, {withFileTypes: true})) {
      if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
        walk(path.join(dirPath, entry.name))
        continue
      }

      if (!entry.isFile() || !entry.name.endsWith('.css')) {
        continue
      }

      const filePath = path.join(dirPath, entry.name)
      const source = fs.readFileSync(filePath, 'utf8')
      for (const match of source.matchAll(/\.([-a-z_][\w-]*)/gi)) {
        cssClasses.add(match[1])
      }
    }
  }

  walk(sourceDir)
  return cssClasses
}

const PROJECT_CSS_CLASS_NAMES = readCssClassNames(process.cwd())

const readTailwindPrefix = (rootDir) => {
  const indexCssPath = path.join(rootDir, 'src', 'index.css')
  if (!fs.existsSync(indexCssPath)) {
    return null
  }

  const source = fs.readFileSync(indexCssPath, 'utf8')
  const match = source.match(
    /@import\s+["']tailwindcss["']\s+prefix\(\s*([^\s)]+)\s*\)/,
  )
  if (!match) {
    return null
  }

  return match[1] ?? null
}

const PROJECT_TAILWIND_PREFIX = readTailwindPrefix(process.cwd())

const splitTokenDecorators = (token) => {
  let index = 0
  while (
    index < token.length &&
    (token[index] === '!' || token[index] === '-')
  ) {
    index += 1
  }

  return {
    decorators: token.slice(0, index),
    body: token.slice(index),
  }
}

const getPropertyName = (node) => {
  if (!node) {
    return null
  }

  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type === 'JSXIdentifier') {
    return node.name
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? null
  }

  return null
}

const getCalleeName = (node) => {
  if (!node || node.type !== 'CallExpression') {
    return null
  }

  if (node.callee.type === 'Identifier') {
    return node.callee.name
  }

  return null
}

const isClassHelperCall = (node) => {
  const calleeName = getCalleeName(node)
  return calleeName !== null && CLASS_HELPER_NAMES.has(calleeName)
}

const isCvaCall = (node) => getCalleeName(node) === 'cva'

const normalizeToken = (token) => token.replace(/^!/, '').replace(/^-/, '')

const transformUtilityReference = (
  reference,
  {prefix, knownPrefixes, ignoredClassNames, projectCssClassNames},
) => {
  if (
    !reference ||
    NON_CLASS_TOKENS.has(reference) ||
    reference.includes('${')
  ) {
    return reference
  }

  const {decorators, body} = splitTokenDecorators(reference)
  const firstSeparatorIndex = body.indexOf(':')
  if (firstSeparatorIndex > 0) {
    const leadingSegment = body.slice(0, firstSeparatorIndex)
    const remainder = body.slice(firstSeparatorIndex + 1)

    if (leadingSegment === prefix) {
      if (decorators.length > 0) {
        return `${prefix}:${decorators}${remainder}`
      }
      return reference
    }

    if (knownPrefixes.has(leadingSegment)) {
      return `${prefix}:${decorators}${remainder}`
    }
  }

  if (body.startsWith(`${prefix}:`)) {
    if (decorators.length > 0) {
      return `${prefix}:${decorators}${body.slice(prefix.length + 1)}`
    }
    return reference
  }

  const normalized = normalizeToken(reference)
  if (!normalized || !/[0-9a-z]/i.test(normalized)) {
    return reference
  }

  // Keep project-defined CSS classes and known non-tailwind utility classes.
  if (
    !normalized.includes(':') &&
    (projectCssClassNames.has(normalized) || ignoredClassNames.has(normalized))
  ) {
    return reference
  }

  return `${prefix}:${decorators}${body}`
}

const transformClassSelectorValue = (value, options) =>
  value
    .split(/(\s+)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part)) {
        return part
      }
      return transformUtilityReference(part, options)
    })
    .join('')

const transformClassAttributeSelectors = (token, options) =>
  token.replace(
    CLASS_ATTRIBUTE_SELECTOR_PATTERN,
    (match, operator, quote, value) => {
      const transformedValue = transformClassSelectorValue(value, options)
      if (transformedValue === value) {
        return match
      }
      return `[class${operator}${quote}${transformedValue}${quote}]`
    },
  )

const transformToken = (token, options) => {
  if (!token || NON_CLASS_TOKENS.has(token) || token.includes('${')) {
    return token
  }

  const tokenWithSelectorFixes = transformClassAttributeSelectors(
    token,
    options,
  )
  return transformUtilityReference(tokenWithSelectorFixes, options)
}

const getTokenFixes = (value, options) => {
  const fixes = []
  let cursor = 0

  for (const part of value.split(/(\s+)/)) {
    const start = cursor
    const end = cursor + part.length
    cursor = end

    if (!part || /^\s+$/.test(part)) {
      continue
    }

    const transformed = transformToken(part, options)
    if (transformed !== part) {
      fixes.push({
        start,
        end,
        original: part,
        replacement: transformed,
      })
    }
  }

  return fixes
}

const prefixClassesRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Auto-prefix Tailwind utility classes so lint --fix migrates to prefixed classes',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            minLength: 1,
          },
          ignore: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          knownPrefixes: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingPrefix:
        'Tailwind class token should use the "{{prefix}}:" prefix. Run eslint --fix to migrate automatically.',
      replaceWithPrefix: 'Class "{{original}}" should be "{{replacement}}".',
    },
  },
  create: (context) => {
    const sourceCode = context.sourceCode
    const configuredPrefix =
      context.options[0]?.prefix ?? PROJECT_TAILWIND_PREFIX ?? DEFAULT_PREFIX
    const configuredKnownPrefixes = context.options[0]?.knownPrefixes
    const knownPrefixes = new Set(
      (configuredKnownPrefixes && configuredKnownPrefixes.length > 0
        ? configuredKnownPrefixes
        : DEFAULT_KNOWN_PREFIXES
      ).filter((value) => value !== configuredPrefix),
    )
    const ignoredClassNames = new Set([
      ...(context.options[0]?.ignore ?? []),
      ...EXTRA_IGNORED_CLASS_NAMES,
    ])
    const options = {
      prefix: configuredPrefix,
      knownPrefixes,
      ignoredClassNames,
      projectCssClassNames: PROJECT_CSS_CLASS_NAMES,
    }
    const reportedRanges = new Set()

    const reportTokenFixes = (node, contentStart, value) => {
      for (const tokenFix of getTokenFixes(value, options)) {
        const range = [
          contentStart + tokenFix.start,
          contentStart + tokenFix.end,
        ]
        const rangeKey = `${range[0]}:${range[1]}`
        if (reportedRanges.has(rangeKey)) {
          continue
        }

        reportedRanges.add(rangeKey)
        context.report({
          node,
          messageId: 'replaceWithPrefix',
          data: {
            original: tokenFix.original,
            replacement: tokenFix.replacement,
          },
          fix: (fixer) => fixer.replaceTextRange(range, tokenFix.replacement),
        })
      }
    }

    const reportStringLiteral = (node) => {
      if (typeof node.value !== 'string') {
        return
      }

      const contentStart = node.range[0] + 1
      const rawValue = sourceCode.text.slice(contentStart, node.range[1] - 1)
      reportTokenFixes(node, contentStart, rawValue)
    }

    const reportTemplateElement = (node) => {
      if (!node.value || typeof node.value.raw !== 'string') {
        return
      }

      const contentStart = node.range[0] + 1
      const contentEnd = node.range[1] - (node.tail ? 1 : 2)
      if (contentStart > contentEnd) {
        return
      }

      reportTokenFixes(node, contentStart, node.value.raw)
    }

    const visitClassExpression = (node) => {
      if (!node) {
        return
      }

      switch (node.type) {
        case 'Literal':
          reportStringLiteral(node)
          return
        case 'TemplateLiteral':
          node.quasis.forEach(reportTemplateElement)
          node.expressions.forEach(visitClassExpression)
          return
        case 'ConditionalExpression':
          visitClassExpression(node.consequent)
          visitClassExpression(node.alternate)
          return
        case 'LogicalExpression':
          visitClassExpression(node.left)
          visitClassExpression(node.right)
          return
        case 'ArrayExpression':
          node.elements.forEach(visitClassExpression)
          return
        case 'ObjectExpression':
          for (const property of node.properties) {
            if (
              property.type !== 'Property' ||
              property.computed ||
              property.kind !== 'init'
            ) {
              continue
            }

            const keyName = getPropertyName(property.key)
            if (keyName === 'class' || keyName === 'className') {
              visitClassExpression(property.value)
            }
          }
          return
        case 'CallExpression':
          if (isClassHelperCall(node)) {
            node.arguments.forEach(visitClassExpression)
            return
          }
          if (isCvaCall(node)) {
            visitCvaCall(node)
          }
          return
        case 'JSXExpressionContainer':
          visitClassExpression(node.expression)
          break

        default:
          break
      }
    }

    const visitCvaVariants = (node) => {
      if (!node || node.type !== 'ObjectExpression') {
        return
      }

      for (const variantProperty of node.properties) {
        if (
          variantProperty.type !== 'Property' ||
          variantProperty.computed ||
          variantProperty.kind !== 'init' ||
          variantProperty.value.type !== 'ObjectExpression'
        ) {
          continue
        }

        for (const valueProperty of variantProperty.value.properties) {
          if (
            valueProperty.type !== 'Property' ||
            valueProperty.computed ||
            valueProperty.kind !== 'init'
          ) {
            continue
          }

          visitClassExpression(valueProperty.value)
        }
      }
    }

    const visitCvaCompoundVariants = (node) => {
      if (!node || node.type !== 'ArrayExpression') {
        return
      }

      for (const element of node.elements) {
        if (!element || element.type !== 'ObjectExpression') {
          continue
        }

        for (const property of element.properties) {
          if (
            property.type !== 'Property' ||
            property.computed ||
            property.kind !== 'init'
          ) {
            continue
          }

          const keyName = getPropertyName(property.key)
          if (keyName === 'class' || keyName === 'className') {
            visitClassExpression(property.value)
          }
        }
      }
    }

    const visitCvaSlots = (node) => {
      if (!node || node.type !== 'ObjectExpression') {
        return
      }

      for (const property of node.properties) {
        if (
          property.type !== 'Property' ||
          property.computed ||
          property.kind !== 'init'
        ) {
          continue
        }

        visitClassExpression(property.value)
      }
    }

    const visitCvaCall = (node) => {
      const [baseClassArgument, optionsArgument] = node.arguments
      visitClassExpression(baseClassArgument)

      if (!optionsArgument || optionsArgument.type !== 'ObjectExpression') {
        return
      }

      for (const property of optionsArgument.properties) {
        if (
          property.type !== 'Property' ||
          property.computed ||
          property.kind !== 'init'
        ) {
          continue
        }

        const keyName = getPropertyName(property.key)
        if (keyName === 'variants') {
          visitCvaVariants(property.value)
          continue
        }

        if (keyName === 'compoundVariants') {
          visitCvaCompoundVariants(property.value)
          continue
        }

        if (keyName === 'slots') {
          visitCvaSlots(property.value)
          continue
        }

        if (
          keyName === 'class' ||
          keyName === 'className' ||
          keyName === 'base'
        ) {
          visitClassExpression(property.value)
        }
      }
    }

    return {
      VariableDeclarator: (node) => {
        if (node.id.type !== 'Identifier') {
          return
        }
        if (!CLASS_VARIABLE_NAME_PATTERN.test(node.id.name)) {
          return
        }
        visitClassExpression(node.init)
      },
      JSXAttribute: (node) => {
        const attributeName = getPropertyName(node.name)
        if (!CLASS_ATTRIBUTE_NAMES.has(attributeName)) {
          return
        }

        if (!node.value) {
          return
        }

        if (node.value.type === 'Literal') {
          reportStringLiteral(node.value)
          return
        }

        if (node.value.type === 'JSXExpressionContainer') {
          visitClassExpression(node.value.expression)
        }
      },
      CallExpression: (node) => {
        if (isClassHelperCall(node)) {
          node.arguments.forEach(visitClassExpression)
          return
        }

        if (isCvaCall(node)) {
          visitCvaCall(node)
        }
      },
    }
  },
}

export const tailwindPrefixPlugin = {
  rules: {
    'prefix-classes': prefixClassesRule,
  },
}
