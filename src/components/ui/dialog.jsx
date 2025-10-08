"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-200 data-[state=open]:duration-200",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex w-full max-h-[calc(100vh-2rem)] min-h-0 flex-col overflow-hidden rounded-t-3xl rounded-b-none border border-slate-200 border-b-0 bg-white shadow-[0_-24px_40px_-12px_rgba(15,23,42,0.3)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-48 data-[state=open]:slide-in-from-bottom-48 data-[state=closed]:duration-300 data-[state=open]:duration-300 ease-out lg:inset-auto lg:left-1/2 lg:top-1/2 lg:bottom-auto lg:max-h-[90vh] lg:max-w-3xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)] lg:data-[state=closed]:fade-out-0 lg:data-[state=open]:fade-in-0 lg:data-[state=closed]:slide-out-to-left-1/2 lg:data-[state=open]:slide-in-from-left-1/2 lg:data-[state=closed]:slide-out-to-top-[48%] lg:data-[state=open]:slide-in-from-top-[48%] lg:data-[state=closed]:duration-300 lg:data-[state=open]:duration-300",
        className
      )}
      {...props}>
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 text-left backdrop-blur lg:px-6 lg:py-5",
      className
    )}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 text-right shadow-[0_-8px_16px_-12px_rgba(15,23,42,0.25)] backdrop-blur sm:flex-row sm:items-center sm:justify-end lg:px-6 lg:py-5",
      className
    )}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
