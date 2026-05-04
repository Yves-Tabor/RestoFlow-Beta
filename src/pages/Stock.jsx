import React, { useState, useEffect } from 'react'

const Stock = () => {
  const [stockData, setStockData] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [newQuantity, setNewQuantity] = useState('')
  const [newMinStock, setNewMinStock] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStockData()
  }, [])

  const loadStockData = () => {
    fetch('/stock.json')
      .then(response => response.json())
      .then(jsonData => {
        const savedStock = localStorage.getItem('restoflow-stock')
        if (savedStock) {
          const savedData = JSON.parse(savedStock)
          const mergedData = mergeStockData(jsonData, savedData)
          setStockData(mergedData)
        } else {
          setStockData(jsonData)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading stock data:', error)
        setLoading(false)
      })
  }

  const mergeStockData = (baseData, modifiedData) => {
    const merged = JSON.parse(JSON.stringify(baseData))
    
    modifiedData.categories?.forEach(modifiedCategory => {
      const baseCategory = merged.categories.find(cat => cat.id === modifiedCategory.id)
      if (baseCategory) {
        modifiedCategory.items?.forEach(modifiedItem => {
          const baseItem = baseCategory.items.find(item => item.id === modifiedItem.id)
          if (baseItem) {
            baseItem.quantity = modifiedItem.quantity
            baseItem.lastRestocked = modifiedItem.lastRestocked
          }
        })
      }
    })
    
    return merged
  }

  const saveStockData = (updatedData) => {
   
    localStorage.setItem('restoflow-stock', JSON.stringify(updatedData))
    setStockData(updatedData)
    
    updateMenuAvailability(updatedData)
  }

  const updateMenuAvailability = (stockData) => {
    const savedMenu = localStorage.getItem('restoflow-menu')
    if (savedMenu) {
      const menuData = JSON.parse(savedMenu)
      
      const outOfStockItems = new Set()
      stockData.categories.forEach(category => {
        category.items.forEach(item => {
          if (item.quantity === 0) {
            outOfStockItems.add(item.id)
          }
        })
      })
      
      menuData.categories?.forEach(category => {
        category.items?.forEach(menuItem => {
          const hasOutOfStockIngredient = menuItem.ingredients?.some(ingredientId => 
            outOfStockItems.has(ingredientId)
          )
        
          menuItem.disabled = hasOutOfStockIngredient
        })
      })
      
      localStorage.setItem('restoflow-menu', JSON.stringify(menuData))
      
      window.dispatchEvent(new Event('menuUpdated'))
    }
  }

  const handleItemClick = (category, item) => {
    setSelectedItem({ category, item })
    setNewQuantity(item.quantity.toString())
    setNewMinStock(item.minStock.toString())
    setNewPrice(item.price.toString())
    setShowModal(true)
  }

  const handleUpdateQuantity = () => {
    if (!selectedItem || newQuantity === '' || newMinStock === '' || newPrice === '') return
    
    const quantity = parseInt(newQuantity)
    const minStock = parseInt(newMinStock)
    const price = parseFloat(newPrice)
    
    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid quantity (0 or greater)')
      return
    }
    
    if (isNaN(minStock) || minStock < 0) {
      alert('Please enter a valid minimum stock (0 or greater)')
      return
    }
    
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price (0 or greater)')
      return
    }
    
    const updatedData = JSON.parse(JSON.stringify(stockData))
    const categoryIndex = updatedData.categories.findIndex(cat => cat.id === selectedItem.category.id)
    const itemIndex = updatedData.categories[categoryIndex].items.findIndex(item => item.id === selectedItem.item.id)
    
    updatedData.categories[categoryIndex].items[itemIndex].quantity = quantity
    updatedData.categories[categoryIndex].items[itemIndex].minStock = minStock
    updatedData.categories[categoryIndex].items[itemIndex].price = price
    updatedData.categories[categoryIndex].items[itemIndex].lastRestocked = new Date().toISOString().split('T')[0]
    
    saveStockData(updatedData)
    setShowModal(false)
    setSelectedItem(null)
    setNewQuantity('')
    setNewMinStock('')
    setNewPrice('')
  }

  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return { color: 'text-red-600', bg: 'bg-red-200', text: 'Out of Stock' }
    if (quantity <= minStock) return { color: 'text-orange-600', bg: 'bg-orange-200', text: 'Low Stock' }
    return { color: 'text-green-600', bg: 'bg-green-100', text: 'In Stock' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#586152]">Loading stock data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#A0522D]">
      <header className="bg-[#A0522D]/90 backdrop-blur-md fixed top-0 left-0 right-0 z-20 md:z-50 border-b border-[#c4c7c3]/50">
        <div className="flex items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="w-full flex justify-evenly items-center gap-8">
            <span className="text-2xl font-serif text-[#1a1e1b]">RestoFlow</span>
            <nav className="flex gap-6 font-serif text-sm tracking-wide">
              <span className="text-[#1a1e1b] font-semibold">Stock Management</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
        <div className="space-y-8">
          {stockData?.categories?.map((category) => (
            <div key={category.id} className="bg-transparent opacity-60 rounded-md p-4">
              <h2 className="text-2xl font-serif text-black mb-4">{category.name}</h2>
              <p className="text-black mb-6 font-serif text-sm">{category.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {category.items.map((item) => {
                  const status = getStockStatus(item.quantity, item.minStock)
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(category, item)}
                      className={`bg-white p-4 rounded-lg border border-[#c4c7c3] cursor-pointer hover:border-[#bb7336] hover:shadow-lg transition-all relative overflow-hidden ${
                        item.quantity === 0 ? 'opacity-60' : 'opacity-100'
                      }`}
                      style={{
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      <div className="absolute inset-0 bg-white bg-opacity-40"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-serif text-[#1a1e1b]">{item.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#586152]">Quantity:</span>
                            <span className="font-semibold text-black">{item.quantity} {item.unit}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#586152]">Min Stock:</span>
                            <span className="font-semibold text-black">{item.minStock} {item.unit}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#586152]">Price:</span>
                            <span className="font-semibold text-black">${item.price}/{item.unit}</span>
                          </div>
                          
                          <div className="text-xs text-black pt-2 border-t border-[#c4c7c3]/20">
                            Last restocked: {item.lastRestocked}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-serif text-[#1a1e1b] mb-4">
              Update Stock: {selectedItem.item.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#586152] mb-2">
                  Current Quantity
                </label>
                <div className="text-lg font-semibold text-[#1a1e1b]">
                  {selectedItem.item.quantity} {selectedItem.item.unit}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#586152] mb-2">
                  New Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c4c7c3] focus:border-[#bb7336] focus:ring-0 text-[#1a1e1b]"
                  placeholder="Enter new quantity"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#586152] mb-2">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c4c7c3] focus:border-[#bb7336] focus:ring-0 text-[#1a1e1b]"
                  placeholder="Enter minimum stock"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#586152] mb-2">
                  Price per {selectedItem.item.unit}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c4c7c3] focus:border-[#bb7336] focus:ring-0 text-[#1a1e1b]"
                  placeholder="Enter price"
                />
              </div>
              
              {parseInt(newQuantity) === 0 && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                  <strong>Warning:</strong> Setting quantity to 0 will disable all menu items that use this ingredient.
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateQuantity}
                className="flex-1 bg-[#bb7336] text-white py-2 px-4 rounded hover:opacity-90 transition-opacity"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedItem(null)
                  setNewQuantity('')
                  setNewMinStock('')
                  setNewPrice('')
                }}
                className="flex-1 bg-[#c4c7c3] text-white py-2 px-4 rounded hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Stock