import * as React from 'react'

export type PortalContainerNode = DocumentFragment | Element | null

const PortalContainerContext = React.createContext<PortalContainerNode>(null)

interface PortalContainerProviderProps {
  children: React.ReactNode
  container: PortalContainerNode
}

export const PortalContainerProvider: React.FC<
  PortalContainerProviderProps
> = ({children, container}) => {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  )
}

export const usePortalContainer = () => React.useContext(PortalContainerContext)

export const resolvePortalContainer = (
  explicitContainer: PortalContainerNode | undefined,
  contextContainer: PortalContainerNode,
) => explicitContainer ?? contextContainer ?? undefined
