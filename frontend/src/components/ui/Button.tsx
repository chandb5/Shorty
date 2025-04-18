import React, { ButtonHTMLAttributes, JSX, ReactNode } from "react"
import { cn } from "../../lib/utils"

export const buttonVariants: Record<string, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  icon: "h-10 w-10 p-0",
}

const buttonSizes: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  asChild?: boolean;
  children: ReactNode;
}

export function Button({ 
  className, 
  variant = "default", 
  size = "default", 
  asChild = false, 
  children, 
  ...props 
}: ButtonProps): JSX.Element {
  const Comp = asChild ? React.cloneElement(children as React.ReactElement, props) : "button"

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
