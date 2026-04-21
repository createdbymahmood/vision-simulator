export type BrandName = 'MODARA' | 'Sensolist'
export type BrandKey = 'modara' | 'sensolist'

const brandRootClasses = ['brand-modara', 'brand-sensolist'] as const
export type BrandRootClassName = (typeof brandRootClasses)[number]

const normalizeHostname = (hostname: string) => {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

const getHostname = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.hostname
}

const matchesDomain = (hostname: string, domain: string) => {
  const normalizedHostname = normalizeHostname(hostname)
  const normalizedDomain = normalizeHostname(domain)

  return (
    normalizedHostname === normalizedDomain ||
    normalizedHostname.endsWith(`.${normalizedDomain}`)
  )
}

export const isModaraDomain = (hostname = getHostname()) => {
  return matchesDomain(hostname, 'modaragroup.com')
}

export const getBrandKey = (hostname = getHostname()): BrandKey => {
  return isModaraDomain(hostname) ? 'modara' : 'sensolist'
}

export const getBrandName = (hostname = getHostname()): BrandName => {
  return isModaraDomain(hostname) ? 'MODARA' : 'Sensolist'
}

export const getBrandOverride = (hostname = getHostname()): BrandName => {
  return getBrandName(hostname)
}

export const getBrandRootClassName = (
  hostname = getHostname(),
): BrandRootClassName => {
  return getBrandKey(hostname) === 'modara' ? 'brand-modara' : 'brand-sensolist'
}

export const applyBrandRootClassName = (hostname = getHostname()) => {
  if (typeof document === 'undefined') return

  const nextClassName = getBrandRootClassName(hostname)

  const targets: Element[] = [document.documentElement]
  if (document.body) targets.push(document.body)

  for (const el of targets) {
    el.classList.remove(...brandRootClasses)
    el.classList.add(nextClassName)
  }
}

export const applyBrandRootClassNameByKey = (brandKey: BrandKey) => {
  if (typeof document === 'undefined') return

  const nextClassName =
    brandKey === 'modara' ? 'brand-modara' : 'brand-sensolist'

  const targets: Element[] = [document.documentElement]
  if (document.body) targets.push(document.body)

  for (const el of targets) {
    el.classList.remove(...brandRootClasses)
    el.classList.add(nextClassName)
  }
}

export const clearBrandRootClassName = () => {
  if (typeof document === 'undefined') return

  const targets: Element[] = [document.documentElement]
  if (document.body) targets.push(document.body)

  for (const el of targets) {
    el.classList.remove(...brandRootClasses)
  }
}

export const isSensolist = (hostname = getHostname()) => {
  return matchesDomain(hostname, 'sensolist.com')
}

export const getBrandSupportEmail = (hostname = getHostname()) => {
  return isModaraDomain(hostname)
    ? 'Support@modaragroup.com'
    : 'Support@Sensolist.com'
}
