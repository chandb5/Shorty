import React, { HTMLAttributes, JSX, ReactNode } from "react"
import { cn } from "../../lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export function Card({ className, ...props }: CardProps): JSX.Element {
  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
}

export function CardHeader({ className, ...props }: CardProps): JSX.Element {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps): JSX.Element {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

export function CardFooter({ className, ...props }: CardProps): JSX.Element {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
}
