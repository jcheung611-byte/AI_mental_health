/**
 * Page Container Component
 *
 * Consistent content wrapper with max-width and padding
 */

import React, { ReactNode } from 'react'

export interface PageContainerProps {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function PageContainer({
  children,
  size = 'xl',
  padding = 'lg',
  className = '',
}: PageContainerProps) {
  return (
    <div className={`
      w-full
      mx-auto
      ${sizeStyles[size]}
      ${paddingStyles[padding]}
      ${className}
    `.trim()}>
      {children}
    </div>
  )
}
