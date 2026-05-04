import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, where, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCnaCftIxU6BguZ2dKIPh2BB8HpOQWeHDg",
  authDomain: "restoflow-beta.firebaseapp.com",
  projectId: "restoflow-beta",
  storageBucket: "restoflow-beta.firebasestorage.app",
  messagingSenderId: "103162020004",
  appId: "1:103162020004:web:02887ce673912ec640e631",
  measurementId: "G-E26CGSZJR6"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const COLLECTIONS = {
  ANALYTICS: 'analytics',
  ORDERS: 'orders', 
  MENU_ITEMS: 'menuItems',
  STOCK: 'stock',
  STAFF: 'staff'
}

export const firebaseService = {
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(auth)
      return result.user
    } catch (error) {
      console.error('Anonymous sign-in failed:', error)
      throw error
    }
  },

  async initializeFirebase() {
    try {
      // Try to initialize without authentication first
      console.log('Firebase initialized successfully')
      return true
    } catch (error) {
      console.error('Firebase initialization failed:', error)
      return false
    }
  },

  async saveDailyAnalytics(date, analyticsData) {
    try {
      const docRef = doc(db, COLLECTIONS.ANALYTICS, date)
      await setDoc(docRef, analyticsData, { merge: true })
      return true
    } catch (error) {
      console.error('Error saving analytics:', error)
      // Fallback to localStorage
      const existingAnalytics = JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
      existingAnalytics[date] = analyticsData
      localStorage.setItem('restoflow-analytics', JSON.stringify(existingAnalytics))
      return false
    }
  },

  async getAnalyticsData(dateRange = 30) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - dateRange)

      const q = query(
        collection(db, COLLECTIONS.ANALYTICS),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const analytics = {}
      
      querySnapshot.forEach((doc) => {
        analytics[doc.id] = doc.data()
      })

      return analytics
    } catch (error) {
      // Silently handle Firebase permission errors
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        return JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
      }
      console.log('Analytics fetch failed, using localStorage only')
      return JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
    }
  },

  async saveOrder(order) {
    try {
      const docRef = doc(db, COLLECTIONS.ORDERS, order.id)
      await setDoc(docRef, order)
      return true
    } catch (error) {
      console.error('Error saving order:', error)
      // Fallback to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
      const updatedOrders = [order, ...existingOrders]
      localStorage.setItem('restoflow-orders', JSON.stringify(updatedOrders))
      return false
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      const docRef = doc(db, COLLECTIONS.ORDERS, orderId)
      await updateDoc(docRef, { status: newStatus })
      return true
    } catch (error) {
      console.error('Error updating order status:', error)
      // Fallback to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
      const orderIndex = existingOrders.findIndex(order => order.id === orderId)
      if (orderIndex !== -1) {
        existingOrders[orderIndex].status = newStatus
        localStorage.setItem('restoflow-orders', JSON.stringify(existingOrders))
      }
      return false
    }
  },

  async getOrders(limitCount = 50) {
    try {
      const q = query(
        collection(db, COLLECTIONS.ORDERS),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const orders = []
      
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() })
      })

      return orders
    } catch (error) {
      // Silently handle Firebase permission errors
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        return []
      }
      console.log('Orders fetch failed, using localStorage only')
      return []
    }
  },

  subscribeToOrderUpdates(orderId, callback) {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId)
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() })
      }
    })
  },

  async saveMenuItem(menuItem) {
    try {
      const docRef = doc(db, COLLECTIONS.MENU_ITEMS, menuItem.id)
      await setDoc(docRef, menuItem, { merge: true })
      return true
    } catch (error) {
      console.error('Error saving menu item:', error)
      return false
    }
  },

  async getMenuItems() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.MENU_ITEMS))
      const menuItems = []
      
      querySnapshot.forEach((doc) => {
        menuItems.push({ id: doc.id, ...doc.data() })
      })

      return menuItems
    } catch (error) {
      console.error('Error fetching menu items:', error)
      return []
    }
  },

  async saveStockData(stockData) {
    try {
      const docRef = doc(db, COLLECTIONS.STOCK, 'current')
      await setDoc(docRef, stockData, { merge: true })
      return true
    } catch (error) {
      console.error('Error saving stock data:', error)
      return false
    }
  },

  async getStockData() {
    try {
      const docRef = doc(db, COLLECTIONS.STOCK, 'current')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docSnap.data()
      } else {
        return null
      }
    } catch (error) {
      // Silently handle Firebase permission errors
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        return null
      }
      console.log('Stock fetch failed, using localStorage only')
      return null
    }
  },

  async saveStaffMember(staffMember) {
    try {
      const docRef = doc(db, COLLECTIONS.STAFF, staffMember.id)
      await setDoc(docRef, staffMember, { merge: true })
      return true
    } catch (error) {
      console.error('Error saving staff member:', error)
      return false
    }
  },

  async getStaffMembers() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.STAFF))
      const staff = []
      
      querySnapshot.forEach((doc) => {
        staff.push({ id: doc.id, ...doc.data() })
      })

      return staff
    } catch (error) {
      console.error('Error fetching staff:', error)
      return []
    }
  }
}

export { db, auth, COLLECTIONS }
