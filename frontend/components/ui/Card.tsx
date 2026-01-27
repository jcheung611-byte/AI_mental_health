/**
 * Card Component
 *
 * Theme-aware container with variants and interactive states
 */

import React, { HTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  animate?: boolean
  as?: 'div' | 'article' | 'section'
}

const variantStyles = {
  default: 'bg-white border border-neutral-200 shadow-sm',
  bordered: 'bg-white border-2 border-neutral-300',
  elevated: 'bg-white shadow-md hover:shadow-lg',
  flat: 'bg-neutral-50',
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  variant = 'default',
  padding = 'md',
  interactive = false,
  animate = false,
  as = 'div',
  className = '',
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-lg transition-all duration-normal'
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
    : ''

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${interactiveStyles}
    ${className}
  `.trim()

  if (animate) {
    const MotionComponent = motion[as]
    return (
      <MotionComponent
        className={combinedClassName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={interactive ? { scale: 1.02 } : undefined}
        {...(props as any)}
      >
        {children}
      </MotionComponent>
    )
  }

  const Component = as
  return (
    <Component className={combinedClassName} {...props}>
      {children}
    </Component>
  )
}

/**
 * Card Header
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-neutral-600 mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

/**
 * Card Content
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({
  className = '',
  children,
  ...props
}: CardContentProps) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Card Footer
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({
  className = '',
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
