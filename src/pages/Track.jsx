import React, { useState, useEffect } from 'react'

const Track = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load confirmed orders from localStorage
    const savedOrders = localStorage.getItem('restoflow-orders')
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders)
      setOrders(parsedOrders)
    }
    setLoading(false)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-[#bb7336]'
      case 'preparing':
        return 'text-[#f59e0b]'
      case 'ready':
        return 'text-[#10b981]'
      case 'serving':
        return 'text-[#3b82f6]'
      case 'completed':
        return 'text-[#6b7280]'
      default:
        return 'text-[#586152]'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Order Confirmed'
      case 'preparing':
        return 'Kitchen Preparing'
      case 'ready':
        return 'Ready for Pickup'
      case 'serving':
        return 'Being Served'
      case 'completed':
        return 'Completed'
      default:
        return 'Pending'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb7336] mx-auto mb-4"></div>
          <p className="text-[#586152]">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7faf4]">
      <header className="bg-[#f1f5ef]/90 backdrop-blur-md fixed top-0 left-0 right-0 z-20 md:z-50 border-b border-[#c4c7c3]/50">
        <div className="flex items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-center gap-8">
            <span className="text-xl font-serif italic text-[#1a1e1b]">RestoFlow</span>
            <nav className="hidden md:flex gap-6 font-serif text-sm tracking-wide">
              <span className="text-[#1a1e1b] font-semibold">Order Tracking</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-40 px-4 max-w-4xl mx-auto min-h-screen">
        <section className="mb-12 text-center">
          <h1 className="text-5xl font-serif text-[#1a1e1b] mb-4 italic">Order Tracking</h1>
          <p className="text-lg text-[#586152] max-w-lg mx-auto">
            Track the status of your confirmed orders in real-time.
          </p>
        </section>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-[#c4c7c3] mb-4">track_changes</span>
            <h2 className="text-2xl font-serif text-[#1a1e1b] mb-2">No orders to track</h2>
            <p className="text-[#586152] mb-8">Your confirmed orders will appear here</p>
            <a 
              href="/top/menu" 
              className="inline-block px-6 py-3 bg-[#bb7336] text-white font-label-caps tracking-widest uppercase text-xs hover:opacity-90 transition-opacity"
            >
              Browse Menu
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-xs tracking-widest uppercase text-[#586152] mb-6 font-label-caps">Recent Orders</h2>
            
            {orders.map((order) => (
              <div key={order.id} className="bg-[#ebefe9] p-8 rounded-lg">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-serif text-[#1a1e1b] mb-2">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-[#586152]">
                      {new Date(order.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-2xl font-serif text-[#1a1e1b] mt-2">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-label-caps text-[#586152] uppercase tracking-widest">Order Items</h4>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-[#c4c7c3]/20">
                      <div>
                        <p className="font-serif text-[#1a1e1b]">{item.name}</p>
                        <p className="text-sm text-[#586152]">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-[#1a1e1b]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.specialInstructions && (
                  <div className="mt-4 p-4 bg-[#f1f5ef] rounded">
                    <h4 className="text-sm font-label-caps text-[#586152] uppercase tracking-widest mb-2">Special Instructions</h4>
                    <p className="text-sm text-[#1a1e1b]">{order.specialInstructions}</p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-[#bb7336]"></div>
                    <div className="w-16 h-px bg-[#bb7336]"></div>
                    <div className={`w-3 h-3 rounded-full ${order.status === 'confirmed' ? 'bg-[#bb7336]' : 'bg-[#c4c7c3]'}`}></div>
                    <div className="w-16 h-px bg-[#c4c7c3]"></div>
                    <div className={`w-3 h-3 rounded-full ${['preparing', 'ready', 'serving', 'completed'].includes(order.status) ? 'bg-[#bb7336]' : 'bg-[#c4c7c3]'}`}></div>
                    <div className="w-16 h-px bg-[#c4c7c3]"></div>
                    <div className={`w-3 h-3 rounded-full ${['ready', 'serving', 'completed'].includes(order.status) ? 'bg-[#bb7336]' : 'bg-[#c4c7c3]'}`}></div>
                    <div className="w-16 h-px bg-[#c4c7c3]"></div>
                    <div className={`w-3 h-3 rounded-full ${['serving', 'completed'].includes(order.status) ? 'bg-[#bb7336]' : 'bg-[#c4c7c3]'}`}></div>
                    <div className="w-16 h-px bg-[#c4c7c3]"></div>
                    <div className={`w-3 h-3 rounded-full ${order.status === 'completed' ? 'bg-[#bb7336]' : 'bg-[#c4c7c3]'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Track
