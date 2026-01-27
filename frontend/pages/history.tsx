/**
 * History Page
 *
 * View past conversations and search through history
 */

import Head from 'next/head'
import { DesktopNav, MobileNav } from '@/components/navigation'
import { PageContainer, PageHeader } from '@/components/layout'

export default function HistoryPage() {
  return (
    <>
      <Head>
        <title>History - AI Voice Assistant</title>
        <meta name="description" content="Your conversation history" />
      </Head>

      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <DesktopNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <PageContainer>
            <PageHeader
              title="History"
              description="View and search your past conversations"
            />

            {/* Placeholder content */}
            <div className="mt-8 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Today</h3>
                  <span className="text-sm text-gray-500">3 conversations</span>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          Conversation {i}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {i}h ago
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        This is a placeholder for conversation summary text...
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center text-gray-500 py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">
                    Full history functionality coming soon!
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    (Week 7-8 polish phase)
                  </p>
                </div>
              </div>
            </div>
          </PageContainer>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileNav />
      </div>
    </>
  )
}
