import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daw-accent focus-visible:ring-offset-2 focus-visible:ring-offset-daw-bg-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-daw-button hover:bg-daw-button-hover text-daw-text-primary",
        primary: "bg-daw-accent hover:bg-daw-accent-hover text-daw-bg-primary",
        secondary: "bg-daw-bg-panel hover:bg-daw-bg-secondary text-daw-text-primary border border-daw-border",
        danger: "bg-daw-danger hover:bg-red-600 text-white",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white",
        ghost: "hover:bg-daw-button-hover text-daw-text-primary",
        link: "text-daw-accent underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-6 px-2 text-xs rounded",
        sm: "h-7 px-3 text-xs rounded",
        default: "h-8 px-4 text-sm rounded",
        lg: "h-10 px-6 text-base rounded-md",
        icon: "h-8 w-8 rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }