/**
 * App Layout Component
 *
 * Main application layout wrapper with navigation support
 */

import React, { ReactNode } from 'react'
import Head from 'next/head'

export interface AppLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  navigation?: ReactNode
  header?: ReactNode
  className?: string
}

export function AppLayout({
  children,
  title = 'AI Voice Assistant',
  description = 'Your mental health companion',
  navigation,
  header,
  className = '',
}: AppLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`min-h-screen bg-neutral-50 flex ${className}`}>
        {/* Navigation (sidebar or mobile nav) */}
        {navigation && (
          <aside className="flex-shrink-0">
            {navigation}
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          {header && (
            <header className="flex-shrink-0 bg-white border-b border-neutral-200">
              {header}
            </header>
          )}

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
