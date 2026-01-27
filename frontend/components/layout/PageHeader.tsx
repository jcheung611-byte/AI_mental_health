/**
 * Page Header Component
 *
 * Reusable page-level header with title, description, and actions
 */

import React, { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  badge?: ReactNode
  actions?: ReactNode
  breadcrumbs?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="text-sm text-neutral-600">
          {breadcrumbs}
        </div>
      )}

      {/* Title Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-neutral-900 truncate">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-2 text-neutral-600">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
