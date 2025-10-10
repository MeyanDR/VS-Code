import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded-md border border-daw-border bg-daw-bg-panel px-3 py-1 text-sm text-daw-text-primary shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-daw-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daw-accent focus-visible:ring-offset-2 focus-visible:ring-offset-daw-bg-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }