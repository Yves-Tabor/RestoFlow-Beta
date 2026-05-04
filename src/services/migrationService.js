import { firebaseService } from '../firebase'

class MigrationService {
  constructor() {
    this.isMigrating = false
    this.migrationProgress = 0
  }

  needsMigration() {
    const hasLocalData = this.hasLocalStorageData()
    const hasFirebaseData = this.hasFirebaseData()
    return hasLocalData && !hasFirebaseData
  }

  hasLocalStorageData() {
    const keys = ['restoflow-analytics', 'restoflow-orders', 'restoflow-stock', 'restoflow-menu']
    return keys.some(key => localStorage.getItem(key))
  }

  async hasFirebaseData() {
    try {
      const analytics = await firebaseService.getAnalyticsData(1)
      const orders = await firebaseService.getOrders(1)
      const stock = await firebaseService.getStockData()
      return Object.keys(analytics).length > 0 || orders.length > 0 || stock !== null
    } catch (error) {
      // Silently handle Firebase permission errors
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        return false
      }
      console.log('Firebase check failed, using localStorage only')
      return false
    }
  }

  async migrateAllData() {
    if (this.isMigrating) {
      throw new Error('Migration already in progress')
    }

    this.isMigrating = true
    this.migrationProgress = 0

    try {
      await firebaseService.signInAnonymously()
      this.migrationProgress = 10

      await this.migrateAnalytics()
      this.migrationProgress = 30

      await this.migrateOrders()
      this.migrationProgress = 60

      await this.migrateStock()
      this.migrationProgress = 80

      await this.migrateMenu()
      this.migrationProgress = 100

      console.log('Migration completed successfully!')
      return { success: true, progress: 100 }
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    } finally {
      this.isMigrating = false
    }
  }

  async migrateAnalytics() {
    console.log('Migrating analytics data...')
    
    const localAnalytics = localStorage.getItem('restoflow-analytics')
    if (!localAnalytics) return

    const analyticsData = JSON.parse(localAnalytics)
    const promises = []

    Object.entries(analyticsData).forEach(([date, data]) => {
      promises.push(firebaseService.saveDailyAnalytics(date, data))
    })

    await Promise.all(promises)
    console.log(`Migrated ${Object.keys(analyticsData).length} days of analytics`)
  }

  async migrateOrders() {
    console.log('Migrating orders...')
    
    const localOrders = localStorage.getItem('restoflow-orders')
    if (!localOrders) return

    const orders = JSON.parse(localOrders)
    const promises = []

    orders.forEach(order => {
      promises.push(firebaseService.saveOrder(order))
    })

    await Promise.all(promises)
    console.log(`Migrated ${orders.length} orders`)
  }

  async migrateStock() {
    console.log('Migrating stock data...')
    
    const localStock = localStorage.getItem('restoflow-stock')
    if (!localStock) return

    const stockData = JSON.parse(localStock)
    await firebaseService.saveStockData(stockData)
    
    console.log('Migrated stock data')
  }

  async migrateMenu() {
    console.log('🍽️ Migrating menu data...')
    
    const localMenu = localStorage.getItem('restoflow-menu')
    if (!localMenu) return

    const menuData = JSON.parse(localMenu)
    const promises = []

    if (menuData.categories) {
      menuData.categories.forEach(category => {
        promises.push(firebaseService.saveMenuItem({
          id: `category_${category.id}`,
          type: 'category',
          ...category
        }))
      })
    }

    if (menuData.menuItems) {
      menuData.menuItems.forEach(item => {
        promises.push(firebaseService.saveMenuItem({
          id: item.id,
          type: 'menuItem',
          ...item
        }))
      })
    }

    await Promise.all(promises)
    console.log(`Migrated menu data`)
  }

  getProgress() {
    return {
      isMigrating: this.isMigrating,
      progress: this.migrationProgress
    }
  }

  clearLocalStorage() {
    const keys = ['restoflow-analytics', 'restoflow-orders', 'restoflow-stock', 'restoflow-menu']
    keys.forEach(key => localStorage.removeItem(key))
    console.log('Cleared localStorage data')
  }

  async syncAnalytics(date) {
    const localAnalytics = localStorage.getItem('restoflow-analytics')
    if (localAnalytics) {
      const analyticsData = JSON.parse(localAnalytics)
      if (analyticsData[date]) {
        await firebaseService.saveDailyAnalytics(date, analyticsData[date])
        return true
      }
    }
    return false
  }

  async syncOrder(orderId) {
    const localOrders = localStorage.getItem('restoflow-orders')
    if (localOrders) {
      const orders = JSON.parse(localOrders)
      const order = orders.find(o => o.id === orderId)
      if (order) {
        await firebaseService.saveOrder(order)
        return true
      }
    }
    return false
  }

  async syncStock() {
    const localStock = localStorage.getItem('restoflow-stock')
    if (localStock) {
      const stockData = JSON.parse(localStock)
      await firebaseService.saveStockData(stockData)
      return true
    }
    return false
  }
}

export default new MigrationService()
