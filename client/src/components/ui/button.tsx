import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-red-600 text-white hover:bg-red-500 shadow-sm",
        outline:
          "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20 backdrop-blur-sm",
        secondary:
          "bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.06]",
        ghost:
          "hover:bg-white/[0.06] text-gray-300 hover:text-white",
        link:
          "text-primary underline-offset-4 hover:underline",
        glass:
          "backdrop-blur-md bg-white/[0.06] border border-white/[0.10] text-white hover:bg-white/[0.11] hover:border-white/[0.18] shadow-sm",
        "glass-gold":
          "backdrop-blur-md bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] hover:bg-[#D4AF37]/18 hover:border-[#D4AF37]/40 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
