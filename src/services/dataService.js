import { useFirebase } from '../hooks/useFirebase'

class DataService {
  constructor() {
    this.firebase = null
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes cache
  }

  setFirebase(firebaseInstance) {
    this.firebase = firebaseInstance
  }

  getCachedData(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Unified order fetching
  async getOrders(useCache = true) {
    const cacheKey = 'orders'
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached
    }

    try {
      let orders = []
      
      // Try Firebase first
      if (this.firebase) {
        try {
          orders = await this.firebase.getOrders()
          console.log('📦 Orders fetched from Firebase:', orders.length)
        } catch (firebaseError) {
          console.log('⚠️ Firebase connection blocked, using localStorage only:', firebaseError.message)
          // Continue to localStorage fallback
        }
      }
      
      // Always merge with localStorage for latest data
      const localOrders = JSON.parse(localStorage.getItem('restof-orders') || '[]')
      
      // Merge data, preferring Firebase but adding any local-only orders
      const mergedOrders = this.mergeOrdersData(orders, localOrders)
      
      this.setCachedData(cacheKey, mergedOrders)
      return mergedOrders
      
    } catch (error) {
      console.log('⚠️ Network error, using localStorage fallback:', error.message)
      
      // Fallback to localStorage only
      const localOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
      this.setCachedData(cacheKey, localOrders)
      return localOrders
    }
  }

  mergeOrdersData(firebaseOrders, localOrders) {
    const orderMap = new Map()
    
    // Add Firebase orders first
    firebaseOrders.forEach(order => {
      orderMap.set(order.id, order)
    })
    
    // Add/overwrite with local orders (more recent)
    localOrders.forEach(order => {
      orderMap.set(order.id, order)
    })
    
    return Array.from(orderMap.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // Unified analytics fetching
  async getAnalytics(useCache = true) {
    const cacheKey = 'analytics'
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached
    }

    try {
      let analytics = {}
      
      // Try Firebase first
      if (this.firebase) {
        try {
          const firebaseAnalytics = await this.firebase.getAnalyticsData(365) // Get last year
          analytics = firebaseAnalytics
          console.log('📊 Analytics fetched from Firebase:', Object.keys(analytics).length, 'days')
        } catch (firebaseError) {
          console.log('⚠️ Firebase connection blocked for analytics, using localStorage only:', firebaseError.message)
          // Continue to localStorage fallback
        }
      }
      
      // Always merge with localStorage
      const localAnalytics = JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
      
      // Merge analytics data
      const mergedAnalytics = { ...localAnalytics, ...analytics }
      
      this.setCachedData(cacheKey, mergedAnalytics)
      return mergedAnalytics
      
    } catch (error) {
      console.log('⚠️ Network error for analytics, using localStorage only:', error.message)
      
      // Fallback to localStorage only
      const localAnalytics = JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
      this.setCachedData(cacheKey, localAnalytics)
      return localAnalytics
    }
  }

  // Get today's analytics summary
  async getTodayAnalytics() {
    const analytics = await this.getAnalytics()
    const today = new Date().toISOString().split('T')[0]
    
    return analytics[today] || {
      date: today,
      revenue: 0,
      totalOrders: 0,
      averageCheck: 0,
      itemsSold: {},
      orders: []
    }
  }

  // Get today's orders summary
  async getTodayOrders() {
    const orders = await this.getOrders()
    const today = new Date().toISOString().split('T')[0]
    
    return orders.filter(order => 
      order.timestamp && order.timestamp.startsWith(today)
    )
  }

  // Calculate today's revenue from orders
  async getTodayRevenue() {
    const todayOrders = await this.getTodayOrders()
    return todayOrders.reduce((total, order) => total + (order.total || 0), 0)
  }

  // Get order counts by status
  async getOrderCounts() {
    const orders = await this.getOrders()
    const today = new Date().toISOString().split('T')[0]
    const todayOrders = orders.filter(order => 
      order.timestamp && order.timestamp.startsWith(today)
    )
    
    return {
      total: orders.length,
      today: todayOrders.length,
      pending: todayOrders.filter(o => o.status === 'pending').length,
      completed: todayOrders.filter(o => o.status === 'completed').length
    }
  }

  // Clear cache (useful for manual refresh)
  clearCache() {
    this.cache.clear()
  }
}

// Create singleton instance
const dataService = new DataService()

export default dataService
