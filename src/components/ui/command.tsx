import { forwardRef } from "react";
import { Command as Cmdk } from "cmdk";
import { cn } from "@/lib/utils";

export const Command = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Cmdk>>(
  ({ className, ...props }, ref) => (
    <Cmdk
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col rounded-2xl border border-border bg-card text-foreground shadow-xl",
        className
      )}
      {...props}
    />
  )
);
Command.displayName = "command";

export const CommandInput = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Cmdk.Input>
>(({ className, ...props }, ref) => (
  <Cmdk.Input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-xl border-b border-border/80 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground",
      className
    )}
    {...props}
  />
));
CommandInput.displayName = "command-input";

export const CommandList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Cmdk.List>>(
  ({ className, ...props }, ref) => (
    <Cmdk.List ref={ref} className={cn("max-h-80 space-y-2 overflow-y-auto p-3", className)} {...props} />
  )
);
CommandList.displayName = "command-list";

export const CommandEmpty = Cmdk.Empty;
export const CommandGroup = Cmdk.Group;
export const CommandItem = Cmdk.Item;
