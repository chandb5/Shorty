// filepath: /Users/chand/Desktop/Chand-Codes/shorty/frontend/src/components/ui/Separator.tsx
import React, { HTMLAttributes, JSX } from "react"
import { cn } from "../../lib/utils"

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Separator({ 
  className, 
  orientation = "horizontal", 
  ...props 
}: SeparatorProps): JSX.Element {
  return (
    <div
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      {...props}
    />
  )
}
