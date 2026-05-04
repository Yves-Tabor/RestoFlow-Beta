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

  // Unified order fetching (localStorage-first for reliability)
  async getOrders(useCache = true) {
    const cacheKey = 'orders'
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached
    }

    // Use localStorage as primary source for reliability
    const localOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
    console.log('📦 Orders loaded from localStorage:', localOrders.length)
    
    this.setCachedData(cacheKey, localOrders)
    return localOrders
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

  // Unified analytics fetching (localStorage-first for reliability)
  async getAnalytics(useCache = true) {
    const cacheKey = 'analytics'
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached
    }

    // Use localStorage as primary source for reliability
    const localAnalytics = JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
    console.log('📊 Analytics loaded from localStorage:', Object.keys(localAnalytics).length, 'days')
    
    this.setCachedData(cacheKey, localAnalytics)
    return localAnalytics
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
