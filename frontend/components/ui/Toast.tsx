/**
 * Toast Component
 *
 * Notification toast with multiple variants and auto-dismiss
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  isOpen: boolean
  onClose: () => void
  variant?: ToastVariant
  title?: string
  message: string
  duration?: number // Auto-dismiss after ms (0 = no auto-dismiss)
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'
  showIcon?: boolean
}

const variantStyles = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  warning: 'bg-warning text-white',
  info: 'bg-info text-white',
}

const variantIcons = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const positionStyles = {
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
}

export function Toast({
  isOpen,
  onClose,
  variant = 'info',
  title,
  message,
  duration = 5000,
  position = 'bottom-right',
  showIcon = true,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`
            fixed
            ${positionStyles[position]}
            z-50
            ${variantStyles[variant]}
            rounded-lg
            shadow-lg
            px-4
            py-3
            flex
            items-start
            gap-3
            max-w-sm
            min-w-[320px]
          `}
          initial={{ opacity: 0, y: position.includes('top') ? -20 : 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.includes('top') ? -20 : 20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          role="alert"
        >
          {showIcon && (
            <div className="flex-shrink-0 mt-0.5">
              {variantIcons[variant]}
            </div>
          )}

          <div className="flex-1">
            {title && (
              <h3 className="font-semibold text-sm mb-0.5">{title}</h3>
            )}
            <p className="text-sm opacity-90">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
