import {$} from 'zx'

const allowedBumpTypes = new Set(['major', 'minor', 'patch'])
const bumpType = process.argv[2]
const usage = 'Usage: node scripts/create-release-tag.mjs <major|minor|patch>'
const releaseTagPattern =
  /^v\d+\.\d+\.\d+(?:-[-.0-9A-Za-z]+)?(?:\+[-.0-9A-Za-z]+)?$/

let createdTag = ''
let releaseCommitPushed = false

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const getErrorMessage = (error) => {
  if (
    error &&
    typeof error === 'object' &&
    'stderr' in error &&
    typeof error.stderr === 'string' &&
    error.stderr.trim()
  ) {
    return error.stderr.trim()
  }

  if (
    error &&
    typeof error === 'object' &&
    'stdout' in error &&
    typeof error.stdout === 'string' &&
    error.stdout.trim()
  ) {
    return error.stdout.trim()
  }

  return error instanceof Error ? error.message : String(error)
}

const cleanupTag = async (tag) => {
  if (!tag) {
    return
  }

  try {
    await $`git show-ref --verify --quiet refs/tags/${tag}`
    await $`git tag -d ${tag}`
    console.error(`Deleted local tag ${tag} after failure.`)
  } catch {
    // No local tag to delete.
  }

  try {
    await $`git ls-remote --exit-code --tags origin refs/tags/${tag}`
    await $`git push origin :refs/tags/${tag}`
    console.error(`Deleted remote tag ${tag} from origin after failure.`)
  } catch {
    // No remote tag to delete.
  }
}

if (!allowedBumpTypes.has(bumpType)) {
  fail(`${usage}\nReceived: ${bumpType ?? '<missing>'}`)
}

try {
  await $`git rev-parse --is-inside-work-tree`
} catch {
  fail('This command must run inside a git repository.')
}

const workingTreeStatus = (await $`git status --porcelain`).stdout.trim()

if (workingTreeStatus) {
  fail(
    [
      'Working tree is not clean. Commit or stash changes before releasing.',
      '',
      workingTreeStatus,
    ].join('\n'),
  )
}

const currentBranch = (await $`git rev-parse --abbrev-ref HEAD`).stdout.trim()

if (currentBranch === 'HEAD') {
  fail('Cannot release from detached HEAD. Checkout a branch and retry.')
}

try {
  await $`git remote get-url origin`
} catch {
  fail("Missing 'origin' remote. Configure it before releasing.")
}

try {
  await $`git push --dry-run origin HEAD`
} catch {
  fail(
    [
      'Preflight push check failed for origin/HEAD.',
      'Fix remote auth/permissions or sync your branch, then retry release.',
    ].join('\n'),
  )
}

try {
  console.log(`Bumping ${bumpType} version and creating tag...`)
  const versionOutput = (
    await $`npm version ${bumpType} --tag-version-prefix v -m ${'chore(release): %s'}`
  ).stdout.trim()

  createdTag =
    versionOutput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1) ?? ''

  if (!createdTag || !releaseTagPattern.test(createdTag)) {
    await cleanupTag(createdTag)
    fail(
      [
        `Could not parse a valid release tag from npm output: ${versionOutput || '<empty>'}`,
        'Expected format: vX.Y.Z',
      ].join('\n'),
    )
  }

  const packageVersion = (
    await $`node -p "require('./package.json').version"`
  ).stdout.trim()

  if (`v${packageVersion}` !== createdTag) {
    await cleanupTag(createdTag)
    fail(
      `Tag/version mismatch after version bump: tag=${createdTag}, package.json=${packageVersion}`,
    )
  }

  console.log('Pushing release commit...')
  await $`git push origin HEAD`
  releaseCommitPushed = true

  console.log(`Pushing tag ${createdTag}...`)
  await $`git push origin ${createdTag}`

  console.log(
    `Release tag ${createdTag} pushed. GitHub Actions will publish from this tag.`,
  )
} catch (error) {
  await cleanupTag(createdTag)

  const details = [`Release command failed: ${getErrorMessage(error)}`]

  if (releaseCommitPushed) {
    details.push(
      'The release commit was already pushed to origin. Only the tag was rolled back.',
    )
  }

  fail(details.join('\n'))
}
