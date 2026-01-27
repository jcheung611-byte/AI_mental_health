/**
 * Input Component
 *
 * Theme-aware input field with label, error states, and icons
 */

import React, { forwardRef, InputHTMLAttributes } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      size = 'md',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error

    const baseInputStyles = `
      w-full
      border-2
      rounded-md
      transition-all
      duration-fast
      focus:outline-none
      placeholder:text-neutral-400
      ${sizeStyles[size]}
      ${
        hasError
          ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
          : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
      }
      ${disabled ? 'bg-neutral-100 cursor-not-allowed opacity-60' : 'bg-white'}
      ${icon && iconPosition === 'left' ? 'pl-10' : ''}
      ${icon && iconPosition === 'right' ? 'pr-10' : ''}
    `.trim()

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={baseInputStyles}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${props.id || props.name}-error` : helperText ? `${props.id || props.name}-helper` : undefined
            }
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${props.id || props.name}-error`}
            className="mt-1.5 text-sm text-error"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id || props.name}-helper`}
            className="mt-1.5 text-sm text-neutral-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

/**
 * Textarea Component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      resize = 'vertical',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error

    const baseTextareaStyles = `
      w-full
      px-4
      py-2
      border-2
      rounded-md
      transition-all
      duration-fast
      focus:outline-none
      placeholder:text-neutral-400
      ${
        hasError
          ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
          : 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
      }
      ${disabled ? 'bg-neutral-100 cursor-not-allowed opacity-60' : 'bg-white'}
      resize-${resize}
    `.trim()

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          className={baseTextareaStyles}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${props.id || props.name}-error` : helperText ? `${props.id || props.name}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p
            id={`${props.id || props.name}-error`}
            className="mt-1.5 text-sm text-error"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id || props.name}-helper`}
            className="mt-1.5 text-sm text-neutral-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
