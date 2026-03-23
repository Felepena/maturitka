"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Items({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // Container becomes a simple vertical stack; each item is its own card
  return <div className={cn("space-y-3", className)} {...props} />
}

export function Item({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // Individual card styling with softer background
  return (
    <div
      className={cn(
        "w-full flex items-start justify-between gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/80 shadow-sm transition-colors hover:bg-neutral-100/70",
        className,
      )}
      {...props}
    />
  )
}

export function ItemTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-base font-semibold tracking-tight text-neutral-900", className)} {...props} />
}

export function ItemDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-neutral-600", className)} {...props} />
}

export function ItemAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0", className)} {...props} />
}

export default Items
