import type {ReactNode} from 'react'

import type {EditorMode} from '@/features/scene/types/types'

export interface TopPanelBackButtonSlotProps {
  onBack: () => void
  projectName: string
  editorMode: EditorMode
  isEditMode: boolean
  defaultButton: ReactNode
}

export interface EditorTopPanelSlots {
  backButton?: (props: TopPanelBackButtonSlotProps) => ReactNode
}

export interface EditorTopPanelUiOverrides {
  slots?: EditorTopPanelSlots
}

export interface EditorUiOverrides {
  topPanel?: EditorTopPanelUiOverrides
}
