/**
 * Badge & Spinner Components
 *
 * Small status indicators and loading spinners
 */

import React, { HTMLAttributes } from 'react'

/**
 * Badge Component
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  dot?: boolean
}

const variantStyles = {
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
  secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  accent: 'bg-accent-100 text-accent-700 border-accent-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  rounded = true,
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        font-medium
        border
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {dot && (
        <span
          className={`
            w-1.5
            h-1.5
            rounded-full
            ${variant === 'primary' && 'bg-primary-500'}
            ${variant === 'secondary' && 'bg-secondary-500'}
            ${variant === 'accent' && 'bg-accent-500'}
            ${variant === 'success' && 'bg-green-500'}
            ${variant === 'warning' && 'bg-yellow-500'}
            ${variant === 'error' && 'bg-red-500'}
            ${variant === 'neutral' && 'bg-neutral-500'}
          `}
        />
      )}
      {children}
    </span>
  )
}

/**
 * Spinner Component
 */
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'white'
}

const spinnerSizeStyles = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
}

const spinnerVariantStyles = {
  primary: 'border-primary-200 border-t-primary-600',
  secondary: 'border-secondary-200 border-t-secondary-600',
  accent: 'border-accent-200 border-t-accent-600',
  neutral: 'border-neutral-200 border-t-neutral-600',
  white: 'border-white/20 border-t-white',
}

export function Spinner({
  size = 'md',
  variant = 'primary',
  className = '',
  ...props
}: SpinnerProps) {
  return (
    <div
      className={`
        inline-block
        rounded-full
        animate-spin
        ${spinnerSizeStyles[size]}
        ${spinnerVariantStyles[variant]}
        ${className}
      `.trim()}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
