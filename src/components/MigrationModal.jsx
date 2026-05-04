import React, { useState } from 'react'
import { useFirebase } from '../hooks/useFirebase'

const MigrationModal = ({ isOpen, onClose, onMigrationComplete }) => {
  const { migrateData, isMigrating, migrationProgress, error, needsMigration } = useFirebase()
  const [isStarted, setIsStarted] = useState(false)

  const handleStartMigration = async () => {
    setIsStarted(true)
    try {
      await migrateData()
      setTimeout(() => {
        onMigrationComplete?.()
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Migration failed:', err)
    }
  }

  if (!isOpen || !needsMigration) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#bb7336]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-2xl text-[#bb7336]">cloud_upload</span>
          </div>
          
          <h2 className="text-2xl font-serif text-[#1a1e1b] mb-2">Migrate to Firebase</h2>
          <p className="text-[#586152] mb-6">
            We found local data that needs to be migrated to Firebase for cloud storage and real-time sync.
          </p>

          {!isStarted ? (
            <div className="space-y-4">
              <div className="text-left bg-[#f7faf4] rounded-lg p-4">
                <h3 className="font-medium text-[#1a1e1b] mb-2">What will be migrated:</h3>
                <ul className="space-y-1 text-sm text-[#586152]">
                  <li>• Analytics data (daily aggregates)</li>
                  <li>• Order history and status</li>
                  <li>• Stock inventory levels</li>
                  <li>• Menu items and categories</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleStartMigration}
                  className="flex-1 bg-[#bb7336] text-white py-3 rounded-lg hover:bg-[#9a5e2a] transition-colors font-medium"
                >
                  Start Migration
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-[#f7faf4] text-[#586152] py-3 rounded-lg hover:bg-[#e8ece6] transition-colors font-medium"
                >
                  Later
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="w-full bg-[#f7faf4] rounded-full h-3">
                  <div 
                    className="bg-[#bb7336] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${migrationProgress}%` }}
                  ></div>
                </div>
                <p className="text-center mt-2 text-sm text-[#586152]">
                  {migrationProgress < 100 ? 'Migrating data...' : 'Migration complete!'}
                </p>
              </div>

              {migrationProgress === 100 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">✅ All data successfully migrated to Firebase!</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">❌ Migration failed: {error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MigrationModal
