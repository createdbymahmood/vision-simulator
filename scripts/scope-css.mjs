import {readFile, writeFile, mkdir} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

const DEFAULT_SCOPE = ':where(.vision-simulator)'
const DEFAULT_DARK_SELECTOR = '.dark'

const ROOT_TAGS = new Set(['html', 'body'])

const scopeCache = new Map()

function cloneScopeNodes(scopeSelector) {
  if (!scopeCache.has(scopeSelector)) {
    const parsed = selectorParser().astSync(scopeSelector)
    const scopeNodes = parsed.nodes[0]?.nodes ?? []
    scopeCache.set(scopeSelector, scopeNodes)
  }

  return scopeCache
    .get(scopeSelector)
    .map((node) => node.clone())
}

function isKeyframesRule(rule) {
  let parent = rule.parent
  while (parent) {
    if (
      parent.type === 'atrule' &&
      typeof parent.name === 'string' &&
      parent.name.toLowerCase().includes('keyframes')
    ) {
      return true
    }
    parent = parent.parent
  }
  return false
}

function isRootNode(node) {
  if (node.type === 'tag') {
    return ROOT_TAGS.has(node.value)
  }
  if (node.type === 'pseudo') {
    return node.value === ':root'
  }
  return false
}

function getFirstCompound(selector) {
  const nodes = []
  for (const node of selector.nodes) {
    if (node.type === 'combinator') {
      break
    }
    nodes.push(node)
  }
  return nodes
}

function isSingleClassSelector(selector, className) {
  const nodes = selector.nodes.filter((node) => node.type !== 'comment')
  return (
    nodes.length === 1 &&
    nodes[0].type === 'class' &&
    nodes[0].value === className
  )
}

function prependScope(selector, scopeSelector) {
  const scopeNodes = cloneScopeNodes(scopeSelector)
  selector.prepend(...scopeNodes)

  const firstOriginalNode = selector.nodes[scopeNodes.length]
  if (firstOriginalNode && firstOriginalNode.type !== 'combinator') {
    selector.insertAfter(
      scopeNodes[scopeNodes.length - 1],
      selectorParser.combinator({value: ' '}),
    )
  }
}

function insertScopeAfterFirstCombinator(selector, scopeSelector) {
  const firstCombinatorIndex = selector.nodes.findIndex(
    (node) => node.type === 'combinator',
  )
  if (firstCombinatorIndex === -1) {
    prependScope(selector, scopeSelector)
    return
  }

  const combinatorNode = selector.nodes[firstCombinatorIndex]
  let lastInserted = combinatorNode
  const scopeNodes = cloneScopeNodes(scopeSelector)

  for (const node of scopeNodes) {
    selector.insertAfter(lastInserted, node)
    lastInserted = node
  }

  const nextNode = lastInserted.next()
  if (nextNode && nextNode.type !== 'combinator') {
    selector.insertAfter(
      lastInserted,
      selectorParser.combinator({value: ' '}),
    )
  }
}

function scopeSelectorList(selectorText, {scopeSelector, darkClass}) {
  const processor = selectorParser((selectors) => {
    const originalSelectors = selectors.nodes.slice()
    for (const selector of originalSelectors) {
      if (selector.nodes.length === 0) {
        continue
      }

      if (darkClass && isSingleClassSelector(selector, darkClass)) {
        const darkScoped = selectorParser().astSync(
          `.${darkClass} ${scopeSelector}`,
        ).nodes[0]
        const scopeDark = selectorParser().astSync(
          `${scopeSelector}.${darkClass}`,
        ).nodes[0]
        selector.replaceWith(darkScoped)
        selectors.insertAfter(darkScoped, scopeDark)
        continue
      }

      const firstCompound = getFirstCompound(selector)
      let removedRoot = false

      for (const node of firstCompound) {
        if (isRootNode(node)) {
          node.remove()
          removedRoot = true
        }
      }

      if (selector.nodes.length === 0) {
        selector.append(...cloneScopeNodes(scopeSelector))
        continue
      }

      if (darkClass) {
        const hasDarkContext = firstCompound.some(
          (node) => node.type === 'class' && node.value === darkClass,
        )
        const hasCombinator = selector.nodes.some(
          (node) => node.type === 'combinator',
        )

        if (hasDarkContext && hasCombinator && !removedRoot) {
          insertScopeAfterFirstCombinator(selector, scopeSelector)
          continue
        }
      }

      prependScope(selector, scopeSelector)
    }
  })

  return processor.processSync(selectorText)
}

export function scopeCss(
  css,
  {
    scopeSelector = process.env.VISION_SIMULATOR_SCOPE || DEFAULT_SCOPE,
    darkSelector = process.env.VISION_SIMULATOR_DARK_SELECTOR ||
      DEFAULT_DARK_SELECTOR,
  } = {},
) {
  const darkClass = darkSelector.startsWith('.')
    ? darkSelector.slice(1)
    : null

  const root = postcss.parse(css)
  root.walkRules((rule) => {
    if (isKeyframesRule(rule)) {
      return
    }
    if (!rule.selector) {
      return
    }

    rule.selector = scopeSelectorList(rule.selector, {
      scopeSelector,
      darkClass,
    })
  })

  return root.toString()
}

export async function scopeCssFile(
  inputPath,
  outputPath,
  {scopeSelector, darkSelector} = {},
) {
  const resolvedInput = path.resolve(inputPath)
  const resolvedOutput = path.resolve(outputPath)
  const css = await readFile(resolvedInput, 'utf8')
  const scoped = scopeCss(css, {scopeSelector, darkSelector})
  await mkdir(path.dirname(resolvedOutput), {recursive: true})
  await writeFile(resolvedOutput, scoped, 'utf8')
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url)

if (isCli) {
  const [input, output] = process.argv.slice(2)
  if (!input || !output) {
    console.error(
      'Usage: node scripts/scope-css.mjs <input.css> <output.css>',
    )
    process.exit(1)
  }

  scopeCssFile(input, output).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
