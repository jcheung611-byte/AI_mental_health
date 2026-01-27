/**
 * Memory Panel Component (Desktop Only)
 *
 * Persistent right sidebar showing user memories
 * - Only visible on desktop (md:block)
 * - Collapsible
 * - Shows memories from MemoryContext
 * - Allows deleting individual memories
 * - Auto-scrolls to new memories
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemory } from '@/contexts/MemoryContext'

export function MemoryPanel() {
  const { memories, memoryEnabled, setMemoryEnabled, clearMemories } = useMemory()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 56 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col bg-white border-l border-gray-200 h-screen sticky top-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 flex-shrink-0">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-lg font-semibold text-gray-900">Memories</h2>
            <p className="text-xs text-gray-500">{memories.length} saved</p>
          </motion.div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isCollapsed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            )}
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Memory toggle */}
          <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Memory Enabled
              </span>
              <button
                onClick={() => setMemoryEnabled(!memoryEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  memoryEnabled ? 'bg-purple-500' : 'bg-gray-300'
                }`}
                aria-label="Toggle memory"
              >
                <motion.span
                  animate={{ x: memoryEnabled ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>
            {memoryEnabled && (
              <p className="text-xs text-gray-500 mt-1">
                I'll remember important details
              </p>
            )}
          </div>

          {/* Memories list */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {memories.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <p className="text-sm text-gray-500">
                  No memories yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Start chatting to save memories
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {memories.map((memory) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative bg-purple-50 rounded-lg p-3 hover:bg-purple-100 transition-colors"
                    >
                      <p className="text-sm text-gray-800 leading-relaxed pr-6">
                        {memory.fact}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </p>

                      {/* Delete button - shows on hover */}
                      <button
                        onClick={() => {
                          // TODO: Add delete single memory function to MemoryContext
                          console.log('Delete memory:', memory.id)
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-purple-200 rounded transition-opacity"
                        aria-label="Delete memory"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer actions */}
          {memories.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  if (confirm('Clear all memories? This cannot be undone.')) {
                    clearMemories()
                  }
                }}
                className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All Memories
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Collapsed state */}
      {isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 py-4"
        >
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-2">{memories.length}</p>
          </div>
        </motion.div>
      )}
    </motion.aside>
  )
}
