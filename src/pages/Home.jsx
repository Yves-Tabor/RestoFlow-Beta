import React, { useState, useEffect } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import { useFirebase } from '../hooks/useFirebase'
import dataService from '../services/dataService'

const Home = () => {
  const stockData = useLoaderData()
  const { getOrders, getAnalyticsData } = useFirebase()
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [activeOrders, setActiveOrders] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize data service with Firebase
    dataService.setFirebase({ getOrders, getAnalyticsData })
    
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get today's revenue from orders (not cart)
      const revenue = await dataService.getTodayRevenue()
      setTodayRevenue(revenue)
      
      // Get today's order counts
      const orderCounts = await dataService.getOrderCounts()
      setActiveOrders(orderCounts.pending)
      setTotalOrders(orderCounts.today)
      
      console.log('🏠 Dashboard data loaded:', { revenue, orderCounts })
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stockItems = stockData?.categories?.flatMap(cat => cat.items) || []
  const totalStockItems = stockItems.length
  const lowStockItems = stockItems.filter(item => item.quantity < 5).length
  const totalStockValue = stockItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  const stats = [
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      change: "+12.5%",
      icon: "payments",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Pending Orders",
      value: activeOrders,
      change: "+3 today",
      icon: "shopping_cart",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Stock Items",
      value: totalStockItems,
      change: `${lowStockItems} low stock`,
      icon: "inventory",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Stock Value",
      value: `$${totalStockValue.toFixed(0)}`,
      change: "Total inventory",
      icon: "warehouse",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

  const quickActions = [
    {
      title: "View Menu",
      description: "Manage menu items and pricing",
      icon: "restaurant_menu",
      to: "/top/menu",
      color: "bg-orange-500"
    },
    {
      title: "Check Stock",
      description: "Monitor inventory levels",
      icon: "inventory_2",
      to: "/top/stock",
      color: "bg-blue-500"
    },
    {
      title: "View Cart",
      description: "Manage current orders",
      icon: "shopping_cart",
      to: "/top/cart",
      color: "bg-green-500"
    },
    {
      title: "Analytics",
      description: "Business insights",
      icon: "analytics",
      to: "/top/analytics",
      color: "bg-purple-500"
    }
  ]

  const lowStockAlerts = stockItems.filter(item => item.quantity < 5).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#f7faf4] p-6">
      <div className="max-w-7xl mx-auto">
    
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#1a1e1b] mb-2">Restaurant Dashboard</h1>
          <p className="text-[#586152]">Welcome back! Here's your restaurant actual overview.</p>
        </div>

      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
              <div className="text-2xl font-bold text-[#1a1e1b] mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.to}
              className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200 group"
            >
              <h3 className="font-serif text-lg text-[#1a1e1b] mb-2">{action.title}</h3>
              <p className="text-sm text-[#586152]">{action.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-[#1a1e1b]">Low Stock Alerts</h3>
              <span className="material-symbols-outlined text-orange-600">warning</span>
            </div>
            {lowStockAlerts.length > 0 ? (
              <div className="space-y-3">
                {lowStockAlerts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium text-[#1a1e1b]">{item.name}</div>
                      <div className="text-sm text-gray-600">Only {item.quantity} {item.unit} left</div>
                    </div>
                    <Link 
                      to="/top/stock"
                      className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                    >
                      Restock
                    </Link>
                  </div>
                ))}
                {lowStockAlerts.length < 3 && (
                  <div className="text-center py-4 text-gray-500">
                    <span className="material-symbols-outlined text-3xl">check circle</span>
                    <p className="text-sm mt-2">All other items well stocked</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="material-symbols-outlined text-4xl">stock circle</span>
                <p className="mt-2">All items are well stocked!</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-[#1a1e1b]">Recent Activity</h3>
              <span className="material-symbols-outlined text-blue-600">timeline</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-[#1a1e1b]">New order received</div>
                  <div className="text-sm text-gray-600">2 minutes ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-[#1a1e1b]">Stock updated</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-[#1a1e1b]">Menu item price changed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 mt-6">
          <h3 className="font-serif text-lg text-[#1a1e1b] mb-4">Revenue Overview</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">analytic chart</span>
              <p className='text-black font-semibold'>Revenue chart will appear here</p>
              <p className="text-sm">Connect analytics to see detailed insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home