import React, { useState, useEffect, useReducer } from 'react'
import { useFirebase } from '../hooks/useFirebase'
import Popup from '../components/Popup'

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return action.payload
    case 'UPDATE_QUANTITY':
      return state.map(item => 
        item.id === action.payload.id 
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0)
    case 'REMOVE_ITEM':
      return state.filter(item => item.id !== action.payload.id)
    case 'CLEAR_CART':
      return []
    default:
      return state
  }
}

const Cart = () => {
  const [cart, dispatch] = useReducer(cartReducer, [])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [popupSubmessage, setPopupSubmessage] = useState('')
  const { saveOrder, updateOrderStatus: updateOrderStatusFirebase, saveAnalytics, saveStock, isConnected } = useFirebase()
  
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('restoflow-cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: 'SET_CART', payload: parsedCart })
      }
    }
    
    loadCart()
    
    const handleStorageChange = (e) => {
      if (e.key === 'restoflow-cart') {
        loadCart()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('restoflow-cart', JSON.stringify(cart))
    } else {
      localStorage.removeItem('restoflow-cart')
    }
  }, [cart])
  
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: itemId } })
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity: newQuantity } })
    }
    setTimeout(() => {
      window.dispatchEvent(new Event('cartUpdated'))
    }, 10)
  }
  
  const removeItem = (itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id: itemId } })
    setTimeout(() => {
      window.dispatchEvent(new Event('cartUpdated'))
    }, 10)
  }
  
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
  
  const serviceCharge = calculateSubtotal() * 0.125
  const total = calculateSubtotal() + serviceCharge
  
  const showOrderPopup = (message, submessage = '') => {
    setPopupMessage(message)
    setPopupSubmessage(submessage)
    setShowPopup(true)
    
    setTimeout(() => {
      setShowPopup(false)
    }, 3000)
  }
  
  const confirmOrder = async () => {
    if (cart.length === 0) return
    
    const order = {
      id: Date.now().toString(),
      items: cart,
      subtotal: calculateSubtotal(),
      serviceCharge: serviceCharge,
      total: total,
      specialInstructions: specialInstructions,
      status: 'pending',
      timestamp: new Date().toISOString()
    }
    
    updateStockOnOrder(cart)
    
    trackAnalyticsData(order)
    
    // Save order (try Firebase first, fallback to localStorage)
    try {
      if (isConnected) {
        await saveOrder(order)
        console.log('✅ Order saved to Firebase:', order.id)
      }
    } catch (error) {
      console.log('⚠️ Firebase save failed, using localStorage fallback:', error.message)
    }
    
    // Always save to localStorage as backup
    const existingOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
    const updatedOrders = [order, ...existingOrders]
    localStorage.setItem('restoflow-orders', JSON.stringify(updatedOrders))
    
    // Trigger orders update event
    window.dispatchEvent(new Event('ordersUpdated'))
    
    // Also update stock (always localStorage)
    await saveStock(JSON.parse(localStorage.getItem('restoflow-stock') || '{}'))
    
    // Update analytics (always localStorage)
    const today = new Date().toISOString().split('T')[0]
    const analyticsData = JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
    if (analyticsData[today]) {
      try {
        if (isConnected) {
          await saveAnalytics(today, analyticsData[today])
          console.log('✅ Analytics saved to Firebase')
        }
      } catch (error) {
        console.log('⚠️ Analytics save failed, using localStorage only:', error.message)
      }
    }
    
    // Don't clear cart - just save order to kitchen
    
    setSpecialInstructions('')
    
    // Show popup and redirect to orders
    showOrderPopup('Order Confirmed!', 'Redirecting to orders...')
    
    setTimeout(() => {
      window.location.href = '/top/orders'
    }, 2000)
  }

  const updateStockOnOrder = (orderItems) => {
    const savedStock = localStorage.getItem('restoflow-stock')
    if (savedStock) {
      const stockData = JSON.parse(savedStock)
      
      orderItems.forEach(orderItem => {
        stockData.categories?.forEach(category => {
          const stockItem = category.items?.find(item => item.id === orderItem.id)
          if (stockItem && stockItem.quantity > 0) {
            stockItem.quantity = Math.max(0, stockItem.quantity - orderItem.quantity)
            stockItem.lastRestocked = new Date().toISOString()
          }
        })
      })
      
      localStorage.setItem('restoflow-stock', JSON.stringify(stockData))
      window.dispatchEvent(new Event('stockUpdated'))
    }
  }

  const trackAnalyticsData = (order) => {
    const today = new Date().toISOString().split('T')[0]
    const existingAnalytics = JSON.parse(localStorage.getItem('restoflow-analytics') || '{}')
    
    if (!existingAnalytics[today]) {
      existingAnalytics[today] = {
        date: today,
        revenue: 0,
        totalOrders: 0,
        averageCheck: 0,
        itemsSold: {},
        orders: []
      }
    }
    
    const dayAnalytics = existingAnalytics[today]
    dayAnalytics.revenue += order.total
    dayAnalytics.totalOrders += 1
    dayAnalytics.averageCheck = dayAnalytics.revenue / dayAnalytics.totalOrders
    dayAnalytics.orders.push(order)
    
    order.items.forEach(item => {
      if (!dayAnalytics.itemsSold[item.id]) {
        dayAnalytics.itemsSold[item.id] = {
          name: item.name,
          quantity: 0,
          revenue: 0
        }
      }
      dayAnalytics.itemsSold[item.id].quantity += item.quantity
      dayAnalytics.itemsSold[item.id].revenue += item.price * item.quantity
    })
    
    localStorage.setItem('restoflow-analytics', JSON.stringify(existingAnalytics))
  }
  
  // Progress is now handled by the Kitchen component - individual order tracking

  const updateOrderStatusLocal = (orderId, newStatus) => {
    const savedOrders = JSON.parse(localStorage.getItem('restoflow-orders') || '[]')
    const updatedOrders = savedOrders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    )
    localStorage.setItem('restoflow-orders', JSON.stringify(updatedOrders))
    window.dispatchEvent(new Event('ordersUpdated'))
  }
  
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-[#c4c7c3] mb-4">Orders Status</span>
          <h2 className="text-2xl font-serif text-[#1a1e1b] mb-2">Your cart is empty</h2>
          <p className="text-[#586152] mb-8">Add some delicious items from our menu</p>
          <a 
            href="/top/menu" 
            className="inline-block px-6 py-3 bg-[#bb7336] text-white font-label-caps tracking-widest uppercase text-xs hover:opacity-90 transition-opacity"
          >
            Browse Menu
          </a>
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
              <span className="text-[#1a1e1b] font-semibold">Order Summary</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-40 px-4 max-w-4xl mx-auto min-h-screen">
        <section className="mb-12 text-center">
          <h1 className="text-5xl font-serif text-[#1a1e1b] mb-4 italic">{cart.length} {cart.length>1? "Items" : "Item"}</h1>
          <p className="text-lg text-[#586152] max-w-lg mx-auto">
            Review your seasonal curation before our kitchen begins the preparation of your experience.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-6">
              <h2 className="text-xs tracking-widest uppercase text-[#586152] mb-6 font-label-caps">Selected Items</h2>
              
              {cart.map((item, index) => (
                <div key={item.id}>
                  <div className="flex gap-6 items-start py-4">
                    <div className="w-24 h-24 bg-[#ebefe9] overflow-hidden rounded-lg">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover grayscale-[20%] transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-serif text-[#1a1e1b]">{item.name}</h3>
                        <span className="text-base text-[#586152]">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-[#586152] text-sm mt-1">{item.description}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-xs font-label-caps text-[#586152]">QTY:</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full border border-[#c4c7c3] flex items-center justify-center hover:bg-[#1a1e1b] hover:text-white transition-colors"
                          >
                            <span className="text-sm">-</span>
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full border border-[#c4c7c3] flex items-center justify-center hover:bg-[#1a1e1b] hover:text-white transition-colors"
                          >
                            <span className="text-sm">+</span>
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-xs underline text-[#c4c7c3] hover:text-[#1a1e1b] transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  {index < cart.length - 1 && <div className="h-px bg-[#c4c7c3]/20 mt-4"></div>}
                </div>
              ))}
            </div>

            <div className="pt-8">
              <label className="text-xs font-label-caps text-[#586152] mb-4 block tracking-widest uppercase">
                Special Instructions
              </label>
              <textarea 
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full bg-[#f1f5ef] border-b border-[#c4c7c3] focus:border-[#bb7336] border-t-0 border-x-0 focus:ring-0 text-base text-[#1a1e1b] placeholder-[#c4c7c3] p-4 transition-all"
                placeholder="Dietary requirements or preferences..."
                rows="3"
              />
            </div>
          </div>

          <div className="lg:col-span-5 sticky top-32">
            <div className="bg-[#ebefe9] p-10 rounded-lg">
              <h2 className="text-xs font-label-caps text-[#586152] mb-8 tracking-widest uppercase">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base text-[#586152]">Subtotal</span>
                  <span className="text-base text-[#1a1e1b]">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-[#586152]">Service Charge (10.5%)</span>
                  <span className="text-base text-[#1a1e1b]">${serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-[#586152]">Gratuity</span>
                  <span className="text-base text-[#1a1e1b]">$0.00</span>
                </div>
                <div className="pt-6 mt-6 border-t border-[#c4c7c3]/20 flex justify-between items-baseline">
                  <span className="text-2xl font-serif text-[#1a1e1b]">Total</span>
                  <span className="text-4xl font-serif text-[#1a1e1b]">${total.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={confirmOrder}
                className="w-full mt-10 py-5 bg-[#bb7336] text-white font-label-caps tracking-widest uppercase text-xs hover:opacity-90 transition-opacity"
              >
                Confirm Order
              </button>
              <div className="flex flex-col items-center justify-center">
                <p className="mt-4 text-[10px] text-center text-gray-400 uppercase tracking-tighter">
                  By confirming, you agree to our Terms of Service and Privacy Policy
                </p>
                <button className='underline text-gray-400 hover:text-gray-600 px-2 text-sm'>read more</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#f7faf4]/80 backdrop-blur-xl py-8 px-4 border-t border-[#c4c7c3]/50">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#c4c7c3] -z-10"></div>

            <div className="absolute top-1/2 left-0 w-2/3 h-px bg-[#bb7336] -z-10"></div>
            
            
          </div>
        </div>
      </footer>
    
    {/* Order Confirmation Popup */}
    <Popup 
      show={showPopup}
      message={popupMessage}
      submessage={popupSubmessage}
      type="success"
    />
    </div>
  )
}

export default Cart
