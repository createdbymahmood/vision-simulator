import fs from 'node:fs'
import path from 'node:path'
import {parse as parseCss} from 'postcss'

const targetPaths =
  process.argv.length > 2
    ? process.argv
        .slice(2)
        .map((targetPath) => path.resolve(process.cwd(), targetPath))
    : [path.resolve(process.cwd(), 'dist/styles.css')]

const TAILWIND_RUNTIME_DEFAULTS_SELECTOR = '*,:before,:after,::backdrop'

const normalizeSelector = (selector) => selector.replace(/\s+/g, '')

const hasOnlyCustomPropertyDeclarations = (rule) =>
  (rule.nodes ?? []).every(
    (node) => node.type === 'decl' && node.prop.startsWith('--'),
  )

const ensureTailwindRuntimeDefaultsFallback = (cssAst) => {
  const normalizedTargetSelector = normalizeSelector(
    TAILWIND_RUNTIME_DEFAULTS_SELECTOR,
  )

  const alreadyHasTopLevelFallback = cssAst.nodes.some((node) => {
    if (node.type !== 'rule') {
      return false
    }

    if (normalizeSelector(node.selector) !== normalizedTargetSelector) {
      return false
    }

    return hasOnlyCustomPropertyDeclarations(node)
  })

  if (alreadyHasTopLevelFallback) {
    return
  }

  let runtimeDefaultsRule = null

  cssAst.walkAtRules('supports', (supportsAtRule) => {
    if (runtimeDefaultsRule) {
      return
    }

    supportsAtRule.walkRules((rule) => {
      if (runtimeDefaultsRule) {
        return
      }

      if (normalizeSelector(rule.selector) !== normalizedTargetSelector) {
        return
      }

      if (!hasOnlyCustomPropertyDeclarations(rule)) {
        return
      }

      runtimeDefaultsRule = rule
    })
  })

  if (!runtimeDefaultsRule) {
    return
  }

  cssAst.prepend(runtimeDefaultsRule.clone())
}

const assertNoTailwindLayerAtRules = (cssAst, cssFilePath) => {
  let hasLayerAtRule = false

  cssAst.walkAtRules('layer', () => {
    hasLayerAtRule = true
  })

  if (!hasLayerAtRule) {
    return
  }

  throw new Error(
    `CSS normalization failed for ${cssFilePath}: @layer at-rules are still present.`,
  )
}

const normalizeCssCode = (cssCode) => {
  const cssAst = parseCss(cssCode)

  cssAst.walkAtRules('layer', (layerAtRule) => {
    if (!layerAtRule.nodes || layerAtRule.nodes.length === 0) {
      layerAtRule.remove()
      return
    }

    layerAtRule.replaceWith(...layerAtRule.nodes)
  })

  ensureTailwindRuntimeDefaultsFallback(cssAst)

  return cssAst.toString()
}

for (const cssFilePath of targetPaths) {
  if (!fs.existsSync(cssFilePath)) {
    throw new Error(`CSS file does not exist: ${cssFilePath}`)
  }

  const cssCode = fs.readFileSync(cssFilePath, 'utf8')
  const normalizedCssCode = normalizeCssCode(cssCode)
  const normalizedCssAst = parseCss(normalizedCssCode)

  assertNoTailwindLayerAtRules(normalizedCssAst, cssFilePath)

  fs.writeFileSync(cssFilePath, normalizedCssAst.toString(), 'utf8')
}
