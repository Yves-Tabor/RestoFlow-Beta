import React, { useState, useEffect } from 'react'
import { useFirebase } from '../hooks/useFirebase'

const History = () => {
  const { getOrders } = useFirebase()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7D')

  useEffect(() => {
    loadOrders()
  }, [selectedPeriod])

  const loadOrders = async () => {
    try {
      const allOrders = await getOrders()
      const filteredOrders = filterOrdersByPeriod(allOrders, selectedPeriod)
      setOrders(filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
    } catch (error) {
      console.error('Error loading orders:', error)
      // Fallback to localStorage
      const localOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
      const localHistory = JSON.parse(localStorage.getItem('restoflow-history') || '[]')
      const allLocalOrders = [...localOrders, ...localHistory]
      const filteredOrders = filterOrdersByPeriod(allLocalOrders, selectedPeriod)
      setOrders(filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
    } finally {
      setLoading(false)
    }
  }

  const filterOrdersByPeriod = (orders, period) => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (period) {
      case '1D':
        cutoffDate.setDate(now.getDate() - 1)
        break
      case '7D':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30D':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90D':
        cutoffDate.setDate(now.getDate() - 90)
        break
      default:
        cutoffDate.setDate(now.getDate() - 7)
    }
    
    return orders.filter(order => new Date(order.timestamp) >= cutoffDate)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'serving': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateTotalRevenue = () => {
    return orders.reduce((total, order) => total + (order.total || 0), 0)
  }

  const calculateTotalOrders = () => {
    return orders.length
  }

  const getPeriodStats = () => {
    const revenue = calculateTotalRevenue()
    const orderCount = calculateTotalOrders()
    const averageCheck = orderCount > 0 ? revenue / orderCount : 0
    
    return {
      revenue: revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      orders: orderCount.toString(),
      averageCheck: `$${averageCheck.toFixed(2)}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb7336] mx-auto mb-4"></div>
          <p className="text-[#586152]">Loading order history...</p>
        </div>
      </div>
    )
  }

  const stats = getPeriodStats()

  return (
    <div className="min-h-screen bg-[#f7faf4]">
      <header className="bg-[#f1f5ef]/90 backdrop-blur-md fixed top-0 left-0 right-0 z-20 md:z-50 border-b border-[#c4c7c3]/50">
        <div className="flex items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-center gap-8 w-full">
            <span className="text-xl font-serif italic text-[#1a1e1b]">RestoFlow</span>
            <nav className="hidden md:flex gap-6 font-serif text-sm tracking-wide">
              <span className="text-[#1a1e1b] font-semibold">Order History</span>
            </nav>
            <div className="bg-white rounded-lg border border-[#c4c7c3]/50 px-4 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#586152] text-sm">calendar</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm text-[#1a1e1b] font-medium"
              >
                <option value="1D">Today</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
                <option value="90D">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-40 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#1a1e1b] mb-4">Order History</h1>
          <p className="text-[#586152]">View and analyze past orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-[#c4c7c3]/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#586152] mb-1">Total Revenue</p>
                <p className="text-2xl font-serif text-[#1a1e1b] font-bold">{stats.revenue}</p>
              </div>
              <div className="w-12 h-12 bg-[#bb7336]/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-[#bb7336]">payments</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-[#c4c7c3]/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#586152] mb-1">Total Orders</p>
                <p className="text-2xl font-serif text-[#1a1e1b] font-bold">{stats.orders}</p>
              </div>
              <div className="w-12 h-12 bg-[#586152]/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-[#586152]">receipt</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-[#c4c7c3]/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#586152] mb-1">Average Check</p>
                <p className="text-2xl font-serif text-[#1a1e1b] font-bold">{stats.averageCheck}</p>
              </div>
              <div className="w-12 h-12 bg-[#1a1e1b]/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-[#1a1e1b]">trending_up</span>
              </div>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#c4c7c3]/50 p-12 text-center">
            <div className="w-16 h-16 bg-[#f7faf4] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl text-[#c4c7c3]">history</span>
            </div>
            <h3 className="text-xl font-serif text-[#1a1e1b] mb-2">No orders found</h3>
            <p className="text-[#586152]">No orders found in the selected period</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#c4c7c3]/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f7faf4]/50">
                    <th className="px-8 py-4 text-left text-xs font-label-caps tracking-widest uppercase text-[#586152]">Order ID</th>
                    <th className="px-8 py-4 text-left text-xs font-label-caps tracking-widest uppercase text-[#586152]">Date & Time</th>
                    <th className="px-8 py-4 text-left text-xs font-label-caps tracking-widest uppercase text-[#586152]">Items</th>
                    <th className="px-8 py-4 text-left text-xs font-label-caps tracking-widest uppercase text-[#586152]">Status</th>
                    <th className="px-8 py-4 text-right text-xs font-label-caps tracking-widest uppercase text-[#586152]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c7c3]/20">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#f7faf4]/50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="font-serif font-medium text-[#1a1e1b]">#{order.id}</span>
                      </td>
                      <td className="px-8 py-5 text-sm text-[#586152]">
                        {formatTime(order.timestamp)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-sm text-[#586152]">
                          {order.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-serif font-medium text-[#1a1e1b]">
                          ${order.total?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default History
