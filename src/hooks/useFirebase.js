import { useState, useEffect, useCallback } from 'react'
import { firebaseService } from '../firebase'
import migrationService from '../services/migrationService'

export const useFirebase = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [error, setError] = useState(null)

  // Initialize Firebase and check for migration
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        await firebaseService.initializeFirebase()
        setIsConnected(true)
        
        // Check if migration is needed
        if (migrationService.needsMigration()) {
          console.log('🔄 Migration needed')
        }
      } catch (err) {
        console.error('Firebase initialization failed:', err)
        setError(err.message)
        setIsConnected(false)
      }
    }

    initializeFirebase()
  }, [])

  // Migration function
  const migrateData = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Firebase not connected')
    }

    setIsMigrating(true)
    setError(null)

    try {
      const result = await migrationService.migrateAllData()
      setMigrationProgress(100)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsMigrating(false)
    }
  }, [isConnected])

  // Analytics functions
  const saveAnalytics = useCallback(async (date, data) => {
    if (!isConnected) return false
    try {
      await firebaseService.saveDailyAnalytics(date, data)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [isConnected])

  const getAnalytics = useCallback(async (dateRange = 30) => {
    if (!isConnected) return {}
    try {
      return await firebaseService.getAnalyticsData(dateRange)
    } catch (err) {
      setError(err.message)
      return {}
    }
  }, [isConnected])

  // Order functions
  const saveOrder = useCallback(async (order) => {
    if (!isConnected) return false
    try {
      await firebaseService.saveOrder(order)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [isConnected])

  const updateOrderStatus = useCallback(async (orderId, status) => {
    if (!isConnected) return false
    try {
      await firebaseService.updateOrderStatus(orderId, status)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [isConnected])

  const getOrders = useCallback(async (limit = 50) => {
    if (!isConnected) return []
    try {
      return await firebaseService.getOrders(limit)
    } catch (err) {
      setError(err.message)
      return []
    }
  }, [isConnected])

  // Stock functions
  const saveStock = useCallback(async (stockData) => {
    if (!isConnected) return false
    try {
      await firebaseService.saveStockData(stockData)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [isConnected])

  const getStock = useCallback(async () => {
    if (!isConnected) return null
    try {
      return await firebaseService.getStockData()
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [isConnected])

  // Menu functions
  const saveMenuItem = useCallback(async (menuItem) => {
    if (!isConnected) return false
    try {
      await firebaseService.saveMenuItem(menuItem)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [isConnected])

  const getMenuItems = useCallback(async () => {
    if (!isConnected) return []
    try {
      return await firebaseService.getMenuItems()
    } catch (err) {
      setError(err.message)
      return []
    }
  }, [isConnected])

  // Real-time subscription
  const subscribeToOrderUpdates = useCallback((orderId, callback) => {
    if (!isConnected) return () => {}
    return firebaseService.subscribeToOrderUpdates(orderId, callback)
  }, [isConnected])

  return {
    // Connection status
    isConnected,
    isMigrating,
    migrationProgress,
    error,
    
    // Migration
    migrateData,
    needsMigration: migrationService.needsMigration(),
    
    // Analytics
    saveAnalytics,
    getAnalytics,
    
    // Orders
    saveOrder,
    updateOrderStatus,
    getOrders,
    subscribeToOrderUpdates,
    
    // Stock
    saveStock,
    getStock,
    
    // Menu
    saveMenuItem,
    getMenuItems,
    
    // Utilities
    clearError: () => setError(null)
  }
}
