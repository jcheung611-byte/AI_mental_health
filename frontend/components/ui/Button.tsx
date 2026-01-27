/**
 * Button Component
 *
 * Theme-aware button with multiple variants, sizes, and states
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  as?: 'button' | 'a'
  href?: string
  animate?: boolean
  className?: string
}

const variantStyles = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-sm hover:shadow-md',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm hover:shadow-md',
  neutral: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300',
  ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
  danger: 'bg-error hover:bg-red-600 text-white shadow-sm hover:shadow-md',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      as = 'button',
      href,
      animate = true,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
    const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none'
    const widthStyles = fullWidth ? 'w-full' : ''

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${widthStyles}
      ${disabled || loading ? disabledStyles : ''}
      ${className}
    `.trim()

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && iconPosition === 'left' && !loading && icon}
        {children}
        {icon && iconPosition === 'right' && !loading && icon}
      </>
    )

    if (as === 'a' && href) {
      return animate ? (
        <motion.a
          href={href}
          className={combinedClassName}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...(props as any)}
        >
          {content}
        </motion.a>
      ) : (
        <a href={href} className={combinedClassName} {...(props as any)}>
          {content}
        </a>
      )
    }

    return animate ? (
      <motion.button
        ref={ref}
        type="button"
        className={combinedClassName}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...(props as any)}
      >
        {content}
      </motion.button>
    ) : (
      <button
        ref={ref}
        type="button"
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'
