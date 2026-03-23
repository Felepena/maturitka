"use client";

import * as React from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void } | null;
const PopCtx = React.createContext<Ctx>(null);

type PopoverProps = {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
};

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const [internal, setInternal] = React.useState(false);
  const controlled = typeof open === "boolean";
  const isOpen = controlled ? (open as boolean) : internal;
  const setOpen = (v: boolean) => {
    if (!controlled) setInternal(v);
    onOpenChange?.(v);
  };
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape, not on hover leave
  React.useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [setOpen]);
  return (
    <PopCtx.Provider value={{ open: isOpen, setOpen }}>
      <div
        ref={wrapperRef}
        className="relative inline-block"
      >
        {children}
      </div>
    </PopCtx.Provider>
  );
}

type TriggerProps = { asChild?: boolean; children: React.ReactElement };
export function PopoverTrigger({ children }: TriggerProps) {
  const ctx = React.useContext(PopCtx);
  if (!ctx) return children;
  const { open, setOpen } = ctx;
  return React.cloneElement(children, {
    onClick: (e: any) => {
      children.props.onClick?.(e);
      setOpen(!open);
    },
  });
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & { align?: string; side?: string; sideOffset?: number };
export function PopoverContent({ className, children, ...rest }: ContentProps) {
  const ctx = React.useContext(PopCtx);
  if (!ctx || !ctx.open) return null;
  return (
    <div className={("absolute z-50 mt-2 rounded-md border border-neutral-200 bg-white p-3 shadow-lg " + (className || "")).trim()} {...rest}>
      {children}
    </div>
  );
}

export default Popover;
