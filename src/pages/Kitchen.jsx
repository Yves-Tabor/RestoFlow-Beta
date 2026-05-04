import React, { useState, useEffect } from 'react'
import { useFirebase } from '../hooks/useFirebase'

const Kitchen = () => {
  const { getOrders, updateOrderStatus: updateOrderStatusFirebase } = useFirebase()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
    
    // Listen for order updates
    const handleOrderUpdate = () => {
      loadOrders()
    }
    
    window.addEventListener('ordersUpdated', handleOrderUpdate)
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrderUpdate)
    }
  }, [])

  const loadOrders = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const allOrders = await getOrders()
      
      // Filter for today's orders and sort by timestamp
      const todayOrders = allOrders
        .filter(order => order.timestamp && order.timestamp.startsWith(today))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setOrders(todayOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      // Fallback to localStorage
      const localOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = localOrders
        .filter(order => order.timestamp && order.timestamp.startsWith(today))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setOrders(todayOrders)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatusFirebase(orderId, newStatus)
      loadOrders() // Refresh orders
    } catch (error) {
      console.error('Error updating order status:', error)
      // Fallback to localStorage
      const localOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
      const orderIndex = localOrders.findIndex(order => order.id === orderId)
      if (orderIndex !== -1) {
        localOrders[orderIndex].status = newStatus
        localStorage.setItem('restoflow-orders', JSON.stringify(localOrders))
        window.dispatchEvent(new Event('ordersUpdated'))
        loadOrders()
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const resetDailyOrders = () => {
    if (confirm('Are you sure you want to reset all orders for today? This will move them to history.')) {
      const today = new Date().toISOString().split('T')[0]
      const localOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
      
      // Move today's orders to history
      const history = JSON.parse(localStorage.getItem('restoflow-history') || '[]')
      const todayOrders = localOrders.filter(order => order.timestamp && order.timestamp.startsWith(today))
      const updatedHistory = [...history, ...todayOrders]
      
      // Keep only non-today orders in current orders
      const remainingOrders = localOrders.filter(order => !order.timestamp || !order.timestamp.startsWith(today))
      
      localStorage.setItem('restoflow-history', JSON.stringify(updatedHistory))
      localStorage.setItem('restoflow-orders', JSON.stringify(remainingOrders))
      
      window.dispatchEvent(new Event('ordersUpdated'))
      loadOrders()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb7336] mx-auto mb-4"></div>
          <p className="text-[#586152]">Loading kitchen orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7faf4]">
      <header className="bg-[#f1f5ef]/90 backdrop-blur-md fixed top-0 left-0 right-0 z-20 md:z-50 border-b border-[#c4c7c3]/50">
        <div className="flex items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-center gap-8 w-full">
            <span className="text-xl font-serif italic text-[#1a1e1b]">RestoFlow</span>
            <nav className="hidden md:flex gap-6 font-serif text-sm tracking-wide">
              <span className="text-[#1a1e1b] font-semibold">Kitchen Outlet</span>
            </nav>
            <button
              onClick={resetDailyOrders}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Reset Daily
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-40 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#1a1e1b] mb-4">Kitchen Orders</h1>
          <p className="text-[#586152]">Manage and track order progress in real-time</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#c4c7c3]/50 p-12 text-center">
            <div className="w-16 h-16 bg-[#f7faf4] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl text-[#c4c7c3]">restaurant</span>
            </div>
            <h3 className="text-xl font-serif text-[#1a1e1b] mb-2">No orders today</h3>
            <p className="text-[#586152]">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-[#c4c7c3]/50 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-[#1a1e1b]">Order #{order.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-[#586152]">{formatTime(order.timestamp)}</span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-[#586152]">Items: </span>
                        <span className="text-[#1a1e1b]">{order.items?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#586152]">Total: </span>
                        <span className="text-[#1a1e1b] font-semibold">${order.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    
                    {/* Show first few items */}
                    <div className="mt-2 text-sm text-[#586152]">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <span key={index}>
                          {item.quantity}x {item.name}
                          {index < Math.min(2, (order.items?.length || 0) - 1) && ', '}
                        </span>
                      ))}
                      {order.items?.length > 3 && ` +${order.items.length - 3} more`}
                    </div>
                    
                    {order.specialInstructions && (
                      <div className="mt-2 text-sm text-[#bb7336] italic">
                        Note: {order.specialInstructions}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
                    >
                      Mark as Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Kitchen
