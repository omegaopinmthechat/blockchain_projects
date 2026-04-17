"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef(function SheetOverlay(
  { className, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn("fixed inset-0 z-50 bg-black/70", className)}
      {...props}
    />
  );
});

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 bg-slate-950 p-4 shadow-lg transition",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-slate-800",
        bottom: "inset-x-0 bottom-0 border-t border-slate-800",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-slate-800 sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l border-slate-800 sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

const SheetContent = React.forwardRef(function SheetContent(
  { side = "right", title = "Dialog", className, children, ...props },
  ref,
) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        {children}
        <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40">
          <X className="h-4 w-4 text-slate-300" />
          <span className="sr-only">Close</span>
        </SheetClose>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});

export { Sheet, SheetTrigger, SheetContent, SheetClose };