import * as React from "react"

import { cn } from "@/lib/utils"

// A styled native <select> matching the Input primitive. Native (not a
// base-ui listbox) so it works directly with React Hook Form's `register`
// without a Controller — enough for simple, single-value pickers.
function NativeSelect({
  className,
  style,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      // The dropdown *popup* is OS/browser-native chrome we can't reliably
      // restyle with CSS (author background/text-color on <option> is often
      // ignored) — `color-scheme` merely picks which native palette the OS
      // uses for it. Forcing "light" here, regardless of the app's own
      // theme, guarantees a readable dark-on-white popup in every browser
      // instead of depending on `.dark`'s color-scheme cascading correctly
      // through portals/dialogs, which was inconsistent.
      style={{ colorScheme: 'light', ...style }}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
