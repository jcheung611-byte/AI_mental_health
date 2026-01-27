/**
 * Settings Page
 *
 * User preferences, voice settings, and app configuration
 */

import Head from 'next/head'
import { DesktopNav, MobileNav } from '@/components/navigation'
import { PageContainer, PageHeader } from '@/components/layout'

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Settings - AI Voice Assistant</title>
        <meta name="description" content="App settings and preferences" />
      </Head>

      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <DesktopNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
          <PageContainer>
            <PageHeader
              title="Settings"
              description="Customize your AI assistant experience"
            />

            {/* Settings sections */}
            <div className="mt-8 space-y-6">
              {/* Voice Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Voice Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voice
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300">
                      <option>Alloy</option>
                      <option>Echo</option>
                      <option>Fable</option>
                      <option>Onyx</option>
                      <option>Nova</option>
                      <option>Shimmer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="px-4 py-2 border-2 border-purple-500 bg-purple-50 text-purple-700 rounded-lg font-medium">
                        Standard
                      </button>
                      <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                        HD
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Memory & Personalization
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Memory Enabled</p>
                      <p className="text-sm text-gray-600">
                        Remember important details from conversations
                      </p>
                    </div>
                    <button className="w-12 h-6 bg-purple-500 rounded-full relative">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Version:</span> 1.0.0 Beta
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> Week 6 - Navigation
                  </p>
                </div>
              </div>

              {/* Placeholder for future settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center text-gray-500">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-sm">
                    More settings will be migrated here in Week 7-8
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    (For now, use the settings button in the chat page)
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
