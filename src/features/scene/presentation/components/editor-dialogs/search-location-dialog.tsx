import React from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'

interface SearchLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenMapStyles: () => void
}

export const SearchLocationDialog: React.FC<SearchLocationDialogProps> = ({
  open,
  onOpenChange,
  onOpenMapStyles,
}) => {
  return (
    <CommandDialog onOpenChange={onOpenChange} open={open}>
      <CommandInput placeholder='Search location...' />
      <CommandList>
        <CommandEmpty>No locations found.</CommandEmpty>
        <CommandGroup heading='Shortcuts'>
          <CommandItem onSelect={onOpenMapStyles}>
            Adjust map style
            <CommandShortcut>⌘M</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
