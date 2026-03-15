"use client"

import React from "react"

type ModalProps = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-2xl shadow-lg border overflow-hidden" style={{backgroundColor:'#EEF3E0', borderColor:'#D6E3B8'}}>
        <div className="px-6 py-4 border-b" style={{borderColor:'#D6E3B8'}}>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        </div>
        <div className="px-6 py-4 text-neutral-800">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{borderColor:'#D6E3B8'}}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

