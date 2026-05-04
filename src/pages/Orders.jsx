import React, { useState, useEffect } from 'react'
import dataService from '../services/dataService'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [forceRender, setForceRender] = useState(0)

  useEffect(() => {
    loadOrders()
    
    const handleOrderUpdate = () => {
      console.log('🔄 Orders updated, reloading...')
      loadOrders()
    }
    
    window.addEventListener('ordersUpdated', handleOrderUpdate)
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrderUpdate)
    }
  }, [showAllOrders])

  const loadOrders = async () => {
    try {
      console.log('🔄 Loading orders from unified data service...')
      const allOrders = await dataService.getOrders()
      console.log('📦 Orders loaded:', allOrders.length, 'orders')
      
      const uniqueOrders = allOrders.reduce((acc, order) => {
        const existingIndex = acc.findIndex(o => o.id === order.id)
        if (existingIndex === -1) {
          const normalizedOrder = {
            ...order,
            status: order.status === 'confirmed' ? 'pending' : order.status
          }
          acc.push(normalizedOrder)
        }
        return acc
      }, [])
      
            
      let filteredOrders = uniqueOrders
      if (!showAllOrders) {
        const today = new Date().toISOString().split('T')[0]
        filteredOrders = uniqueOrders
          .filter(order => order.timestamp && order.timestamp.startsWith(today))
              }
      
            
      setOrders(filteredOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const localOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
    const orderIndex = localOrders.findIndex(order => order.id === orderId)
    
    if (orderIndex !== -1) {
      localOrders[orderIndex].status = newStatus
      localStorage.setItem('restoflow-orders', JSON.stringify(localOrders))
      
      const newOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
      setOrders(newOrders)
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb7336] mx-auto mb-4"></div>
          <p className="text-[#586152]">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7faf4]">
      <header className="bg-[#f1f5ef]/90 backdrop-blur-md fixed top-0 left-0 right-0 z-20 md:z-50 border-b border-[#c4c7c3]/50">
        <div className="flex items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex justify-evenly items-center gap-8 w-full">
            <span className="text-2xl font-serif text-[#1a1e1b]">RestoFlow</span>
            <nav className="flex gap-6 font-serif text-sm tracking-wide">
              <span className="text-[#1a1e1b] font-semibold">Orders</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-40 px-4 max-w-7xl mx-auto">
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif text-[#1a1e1b] mb-4">Orders</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAllOrders(!showAllOrders)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  showAllOrders 
                    ? 'bg-[#bb7336] text-white' 
                    : 'bg-white text-[#586152] border border-[#c4c7c3]'
                }`}
              >
                {showAllOrders ? 'All Orders' : "Today's Orders"}
              </button>
              <button
                onClick={() => {
                  dataService.clearCache()
                  loadOrders()
                }}
                className="bg-[#bb7336] text-white px-4 py-2 rounded-lg hover:bg-[#9a5e2a] transition-colors font-medium text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-[#bb7336] text-white' 
                : 'bg-white text-[#586152] hover:bg-[#f7faf4]'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-[#bb7336] text-white' 
                : 'bg-white text-[#586152] hover:bg-[#f7faf4]'
            }`}
          >
            Pending ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed' 
                ? 'bg-[#bb7336] text-white' 
                : 'bg-white text-[#586152] hover:bg-[#f7faf4]'
            }`}
          >
            Completed ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#c4c7c3]/50 p-12 text-center">
            <h3 className="text-xl font-serif text-[#1a1e1b] mb-2">
              {filter === 'all' ? 'No orders today' : `No ${filter} orders`}
            </h3>
            <p className="text-[#586152]">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="space-y-4">
              {filteredOrders.map((order) => (
              <div key={`${order.id}-${order.status}`} className="bg-white rounded-lg border border-[#c4c7c3]/50 p-6 shadow-sm">
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

export default Orders
