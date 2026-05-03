import React, { useState, useEffect } from 'react'

const Cart = () => {
  const [cart, setCart] = useState([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  
  useEffect(() => {
    const savedCart = localStorage.getItem('restoflow-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])
  
  useEffect(() => {
    localStorage.setItem('restoflow-cart', JSON.stringify(cart))
  }, [cart])
  
  const updateQuantity = (itemId, newQuantity) => {
    let newCart
    if (newQuantity <= 0) {
      newCart = cart.filter(item => item.id !== itemId)
    } else {
      newCart = cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    }
    setCart(newCart)
    window.dispatchEvent(new Event('cartUpdated'))
  }
  
  const removeItem = (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId)
    setCart(newCart)
    window.dispatchEvent(new Event('cartUpdated'))
  }
  
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
  
  const serviceCharge = calculateSubtotal() * 0.125
  const total = calculateSubtotal() + serviceCharge
  
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
      {/* Top Navigation */}
      <header className="bg-[#f1f5ef]/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-[#c4c7c3]/50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-xl font-serif italic text-[#1a1e1b]">RestoFlow</span>
            <nav className="hidden md:flex gap-6 font-serif text-sm tracking-wide">
              <a href="/top/menu" className="text-[#586152] hover:text-[#1a1e1b] transition-colors duration-300">Menu</a>
              <a href="/top/stock" className="text-[#586152] hover:text-[#1a1e1b] transition-colors duration-300">Stock</a>
              <span className="text-[#1a1e1b] font-semibold">Order Summary</span>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-[#1a1e1b]">
            <span className="material-symbols-outlined cursor-pointer hover:opacity-70 transition-opacity">room_service</span>
            <span className="material-symbols-outlined cursor-pointer hover:opacity-70 transition-opacity">notifications</span>
            <div className="relative">
              <span className="material-symbols-outlined cursor-pointer hover:opacity-70 transition-opacity">shopping_bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#bb7336] rounded-full"></span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-40 px-4 max-w-4xl mx-auto min-h-screen">
        {/* Header Section */}
        <section className="mb-12 text-center">
          <h1 className="text-5xl font-serif text-[#1a1e1b] mb-4 italic">Votre Sélection</h1>
          <p className="text-lg text-[#586152] max-w-lg mx-auto">
            Review your seasonal curation before our kitchen begins the preparation of your experience.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Item List & Instructions */}
          <div className="lg:col-span-7 space-y-12">
            {/* Order Items */}
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
                        <span className="text-xs font-label-caps text-[#586152]">QTY: {item.quantity}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full border border-[#c4c7c3] flex items-center justify-center hover:bg-[#1a1e1b] hover:text-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full border border-[#c4c7c3] flex items-center justify-center hover:bg-[#1a1e1b] hover:text-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
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

            {/* Special Instructions */}
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

          {/* Right Column: Summary Card */}
          <div className="lg:col-span-5 sticky top-32">
            <div className="bg-[#ebefe9] p-10 rounded-lg">
              <h2 className="text-xs font-label-caps text-[#586152] mb-8 tracking-widest uppercase">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base text-[#586152]">Subtotal</span>
                  <span className="text-base text-[#1a1e1b]">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-[#586152]">Service Charge (12.5%)</span>
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
              <button className="w-full mt-10 py-5 bg-[#bb7336] text-white font-label-caps tracking-widest uppercase text-xs hover:opacity-90 transition-opacity">
                Confirm Order
              </button>
              <p className="mt-4 text-[10px] text-center text-[#c4c7c3] uppercase tracking-tighter">
                By confirming, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>

            {/* Assistance Card */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[#586152]">
              <span className="material-symbols-outlined text-sm">support_agent</span>
              <span className="text-xs font-label-caps uppercase tracking-widest">Need Assistance?</span>
            </div>
          </div>
        </div>
      </main>

      {/* Progression Indicator (Fixed at Bottom) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#f7faf4]/80 backdrop-blur-xl py-8 px-4 border-t border-[#c4c7c3]/50">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-4 relative">
            {/* Progress Line Background */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#c4c7c3] -z-10"></div>
            {/* Progress Line Active */}
            <div className="absolute top-1/2 left-0 w-2/3 h-px bg-[#bb7336] -z-10"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2 bg-[#f7faf4] px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#bb7336]"></div>
              <span className="text-[10px] font-label-caps uppercase text-[#1a1e1b]">Selection</span>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2 bg-[#f7faf4] px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#bb7336] ring-4 ring-[#bb7336]/10"></div>
              <span className="text-[10px] font-label-caps uppercase text-[#1a1e1b] font-bold">Summary</span>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2 bg-[#f7faf4] px-2 opacity-40">
              <div className="w-2.5 h-2.5 rounded-full bg-[#c4c7c3]"></div>
              <span className="text-[10px] font-label-caps uppercase text-[#586152]">Payment</span>
            </div>
            
            {/* Step 4 */}
            <div className="flex flex-col items-center gap-2 bg-[#f7faf4] px-2 opacity-40">
              <div className="w-2.5 h-2.5 rounded-full bg-[#c4c7c3]"></div>
              <span className="text-[10px] font-label-caps uppercase text-[#586152]">Kitchen</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Cart