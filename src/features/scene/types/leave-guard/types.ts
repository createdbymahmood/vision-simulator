export interface DirtyStateChangePayload {
  isDirty: boolean
  isSaving: boolean
}

export interface UnsavedChangesOptions {
  enabled?: boolean
  onDirtyStateChange?: (payload: DirtyStateChangePayload) => void
  confirmDialogTitle?: string
  confirmDialogDescription?: string
}
