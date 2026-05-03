import React, { useState, useEffect } from 'react'
import { useLoaderData } from 'react-router-dom'

const Menu = () => {
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState('starters')
  const [availableItems, setAvailableItems] = useState({})
  const [showPopup, setShowPopup] = useState(false)
  const [lastAddedItem, setLastAddedItem] = useState(null)
  const menuData = useLoaderData()

  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('restoflow-cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      }
    }
    
    loadCart()
    
    const handleCartUpdated = () => {
      setTimeout(() => {
        loadCart()
      }, 100)
    }
    
    window.addEventListener('cartUpdated', handleCartUpdated)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated)
    }
  }, [])

  useEffect(() => {
    const loadMenuData = () => {
      const savedMenu = localStorage.getItem('restoflow-menu')
      let menuDataToUse = menuData
      
      if (savedMenu) {
        const parsedMenu = JSON.parse(savedMenu)
        menuDataToUse = parsedMenu
      }
      
      const organizedMenu = {}
      menuDataToUse.categories.forEach(category => {
        organizedMenu[category.id] = []
      })
      
      menuDataToUse.menuItems.forEach(item => {
        if (organizedMenu[item.category]) {
          organizedMenu[item.category].push(item)
        }
      })
      
      setAvailableItems(organizedMenu)
    }
    
    loadMenuData()
    
    const handleMenuUpdated = () => {
      loadMenuData()
    }
    
    window.addEventListener('menuUpdated', handleMenuUpdated)
    
    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdated)
    }
  }, [menuData])

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('restoflow-cart', JSON.stringify(cart))
    }
  }, [cart])

  if (!menuData || Object.keys(availableItems).length === 0) {
    return (
      <div className="flex h-screen bg-[#f7faf4] flex items-center justify-center">
        <div className="text-[#1a1e1b] text-lg">Loading menu...</div>
      </div>
    )
  }

  const categories = [
    { id: 'starters', name: 'Starters', icon: 'eco' },
    { id: 'mains', name: 'Mains', icon: 'restaurant' },
    { id: 'sides', name: 'Sides', icon: 'nutrition' },
    { id: 'desserts', name: 'Desserts', icon: 'icecream' },
    { id: 'beverages', name: 'Beverages', icon: 'wine_bar' }
  ]

  const activeItems = availableItems[activeCategory] || []
  const currentCategory = categories.find(cat => cat.id === activeCategory)

  const addToCart = (item) => {
    if (item.disabled) return
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    let newCart
    if (existingItem) {
      newCart = cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    } else {
      newCart = [...cart, { ...item, quantity: 1 }]
    }
    
    setCart(newCart)
    setLastAddedItem(item)
    setShowPopup(true)
    
    setTimeout(() => {
      setShowPopup(false)
    }, 2000)
    
    setTimeout(() => {
      window.dispatchEvent(new Event('cartUpdated'))
    }, 0)
  }

  const resetCart = () => {
    setCart([])
    localStorage.removeItem('restoflow-cart')
    window.dispatchEvent(new Event('cartUpdated'))
  }

  return (
    <div className="min-h-screen bg-[#f7faf4]">
      <nav className="sticky top-0 z-40 bg-white border-b border-[#c4c7c3]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-lg text-[#1a1e1b]">Menu</h2>
            </div>
           <button onClick={resetCart} className="flex justify-end md:hidden bg-[#1a1e1b] text-white px-4 py-2 rounded-lg hover:bg-[#2a2e2b] transition-colors duration-200 text-sm">
             Reset Cart
            </button> 
            <div className="hidden md:flex items-center gap-2">
              {categories.map((category) => {
                const categoryItems = availableItems[category.id] || []
                const availableCount = categoryItems.filter(item => !item.disabled).length
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-serif text-sm tracking-widest uppercase transition-all duration-300 ${
                      activeCategory === category.id
                        ? 'bg-[#1a1e1b] text-white'
                        : 'text-[#586152] hover:bg-[#dce6d3]/50'
                    }`}
                  >
                    <span>{category.name}</span>
                    {availableCount > 0 && (
                      <span className="bg-[#bb7336] text-white px-2 py-0.5 rounded-full text-xs">
                        {availableCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            
            <div className="hidden lg:block">
              <button 
                onClick={resetCart}
                className="font-serif text-sm tracking-widest uppercase bg-[#dce6d3] hover:bg-[#c4c7c3] rounded-lg px-4 py-2 transition-colors duration-200"
              >
                Reset Cart
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-16">
            <span className="text-xs tracking-widest uppercase text-[#444844]">Explore</span>
            <h1 className="text-5xl font-serif text-[#1a1e1b] mt-4 capitalize">{currentCategory.name}</h1>
            <p className="text-lg text-[#586152] max-w-xl mt-6">
              {activeItems.length > 0 
                ? `${activeItems.filter(item => !item.disabled).length} items available based on current stock`
                : 'No items available in this category'
              }
            </p>
          </header>

          {activeItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${
                    item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="relative h-48 bg-[#ebefe9]">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {item.signature && (
                      <div className="absolute top-2 right-2 bg-[#1a1e1b] text-white px-2 py-1 rounded text-xs">
                        Popular
                      </div>
                    )}
                    {item.disabled && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-serif text-[#1a1e1b]">{item.name}</h3>
                      <span className="text-lg font-bold text-[#bb7336]">${item.price}</span>
                    </div>
                    <p className="text-sm text-[#586152] mb-4 line-clamp-2">{item.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#586152]">
                        {item.disabled ? 'Unavailable' : 'Available'}
                      </span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-[#1a1e1b] text-white px-4 py-2 rounded-lg hover:bg-[#2a2e2b] transition-colors duration-200 text-sm"
                        disabled={item.disabled}
                      >
                        {item.disabled ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-[#c4c7c3]">inventory 2</span>
              <h3 className="text-xl font-serif text-[#1a1e1b] mt-4">No items available</h3>
              <p className="text-[#586152] mt-2">Check back later when stock is replenished</p>
            </div>
          )}

          <footer className="mt-30 pt-16 border-t border-[#c4c7c3]/10 text-center">
            <p className="text-xs tracking-widest uppercase text-[#444844] mb-4">FRESH INGREDIENTS, RIGHT SERVING</p>
            <p className="text-base text-[#586152] max-w-2xl mx-auto italic">
              The menu is considering the available stock. Items may become unavailable as orders are processed.
            </p>
          </footer>
        </div>
        <div className='block md:hidden p-7'></div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#f7faf4]/95 backdrop-blur-lg border-t border-[#c4c7c3]/50 flex justify-around py-4 z-50">
        {categories.map((category) => {
          const categoryItems = availableItems[category.id] || []
          const availableCount = categoryItems.filter(item => !item.disabled).length
          
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex flex-col items-center gap-1 ${
                activeCategory === category.id ? 'text-[#1a1e1b] font-semibold' : 'text-[#586152]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-tighter">{category.name}</span>
              {availableCount > 0 && (
                <span className="text-xs bg-[#bb7336] text-white px-2 py-0.5 rounded-full text-[8px]">
                  {availableCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {showPopup && lastAddedItem && (
        <div className="fixed top-20 right-4 bg-[#1a1e1b] text-white px-6 py-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold">{lastAddedItem.name}</p>
              <p className="text-sm text-gray-300">Added to cart!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Menu