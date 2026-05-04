import React, { useState, useEffect } from 'react'
import { useFirebase } from '../hooks/useFirebase'
import dataService from '../services/dataService'

const Analytics = () => {
  const { getAnalyticsData, getOrders } = useFirebase()
  const [selectedPeriod, setSelectedPeriod] = useState('1H')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [pendingOrders, setPendingOrders] = useState([])
  const [displayedOrders, setDisplayedOrders] = useState([])
  const [ordersPage, setOrdersPage] = useState(1)
  const [hasMoreOrders, setHasMoreOrders] = useState(true)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 60 * 60 * 1000)) // 1 hour ago

  useEffect(() => {
    // Initialize data service with Firebase
    dataService.setFirebase({ getOrders, getAnalyticsData })
    
    loadAnalyticsData()
    loadPendingOrders()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const data = await dataService.getAnalytics()
      setAnalyticsData(data)
      console.log('📊 Analytics loaded from unified service:', Object.keys(data).length, 'days')
    } catch (error) {
      console.error('❌ Error loading analytics:', error)
      setAnalyticsData({})
    } finally {
      setLoading(false)
    }
  }

  const loadPendingOrders = async () => {
    try {
      const allOrders = await dataService.getOrders()
      const pending = allOrders
        .filter(order => order.status === 'pending')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setPendingOrders(pending)
      
      // Display first 10 orders
      const initialOrders = pending.slice(0, 10)
      setDisplayedOrders(initialOrders)
      setHasMoreOrders(pending.length > 10)
      
      console.log('📋 Pending orders loaded:', pending.length, 'orders')
    } catch (error) {
      console.error('❌ Error loading pending orders:', error)
      setPendingOrders([])
      setDisplayedOrders([])
    }
  }

  const fetchMoreOrders = () => {
    const nextPage = ordersPage + 1
    const startIndex = nextPage * 10
    const endIndex = startIndex + 10
    const moreOrders = pendingOrders.slice(startIndex, endIndex)
    
    if (moreOrders.length > 0) {
      setDisplayedOrders([...displayedOrders, ...moreOrders])
      setOrdersPage(nextPage)
      setHasMoreOrders(endIndex < pendingOrders.length)
    } else {
      setHasMoreOrders(false)
    }
  }

  const getTodayAnalytics = () => {
    const today = new Date().toISOString().split('T')[0]
    return analyticsData?.[today] || {
      date: today,
      revenue: 0,
      totalOrders: 0,
      averageCheck: 0,
      itemsSold: {},
      orders: []
    }
  }

  const getPeriodAnalytics = () => {
    if (!analyticsData) return getTodayAnalytics()
    
    const today = new Date()
    const dates = Object.keys(analyticsData).sort()
    
    const getDaysForPeriod = (period) => {
      switch (period) {
        case '1H': 
          // For 1 hour, filter by start date
          return dates.filter(date => new Date(date) >= startDate)
        case '7D': return dates.slice(-7)
        case '30D': return dates.slice(-30)
        case '90D': return dates.slice(-90)
        case '1Y': return dates.slice(-365)
        default: return dates.slice(-30)
      }
    }
    
    const periodDays = getDaysForPeriod(selectedPeriod)
    return periodDays.reduce((acc, date) => {
      const day = analyticsData[date]
      if (day) {
        acc.revenue += day.revenue
        acc.totalOrders += day.totalOrders
        acc.averageCheck = acc.revenue / Math.max(1, acc.totalOrders)
        acc.itemsSold = { ...acc.itemsSold, ...day.itemsSold }
        acc.orders = [...acc.orders, ...(day.orders || [])]
      }
      return acc
    }, { revenue: 0, totalOrders: 0, averageCheck: 0, itemsSold: {}, orders: [] })
  }

  const getPopularItems = () => {
    const periodAnalytics = getPeriodAnalytics()
    const itemsSold = periodAnalytics.itemsSold || {}
    
    return Object.entries(itemsSold)
      .map(([itemName, quantity]) => {
        const menuData = JSON.parse(localStorage.getItem('restoflow-menu') || '[]')
        const menuItem = menuData.find(item => item.name === itemName)
        
        return {
          name: itemName,
          quantity: `${quantity} Units`,
          margin: menuItem ? `${Math.round(((menuItem.price - menuItem.cost) / menuItem.price) * 100)}%` : "0%",
          trend: quantity > 10 ? 'up' : 'neutral',
          image: menuItem?.image || "/menuImages/placeholder.jpg"
        }
      })
      .sort((a, b) => parseInt(b.quantity) - parseInt(a.quantity))
      .slice(0, 3)
  }

  const getCategoryData = () => {
    const periodAnalytics = getPeriodAnalytics()
    const itemsSold = periodAnalytics.itemsSold || {}
    const menuData = JSON.parse(localStorage.getItem('restoflow-menu') || '[]')
    
    const categoryRevenue = {}
    
    Object.entries(itemsSold).forEach(([itemName, quantity]) => {
      const menuItem = menuData.find(item => item.name === itemName)
      if (menuItem) {
        const category = menuItem.category || 'Other'
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (menuItem.price * quantity)
      }
    })
    
    return Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({
        name: category,
        revenue: `$${revenue.toFixed(0)}`,
        percentage: Math.round((revenue / periodAnalytics.revenue) * 100)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
  }

  const getPeakTimes = () => {
    const periodAnalytics = getPeriodAnalytics()
    const orders = periodAnalytics.orders || []
    
    const hourCounts = {}
    orders.forEach(order => {
      const hour = new Date(order.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]
    
    return peakHour ? `${peakHour[0]}:00-${peakHour[0] + 1}:00` : "7-9 PM"
  }

  const kpiData = [
    {
      title: "Total Revenue",
      value: getPeriodAnalytics().revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      change: "+12% vs last month",
      bgColor: "bg-[#bb7336]/10",
      color: "text-[#bb7336]",
      icon: "trending_up",
      trend: "up"
    },
    {
      title: "Total Orders",
      value: getPeriodAnalytics().totalOrders.toString(),
      change: "Consistent with average",
      bgColor: "bg-[#586152]/10",
      color: "text-[#586152]",
      icon: "receipt",
      trend: "neutral"
    },
    {
      title: "Average Check",
      value: `$${getPeriodAnalytics().averageCheck.toFixed(2)}`,
      change: "+4% increase",
      bgColor: "bg-[#1a1e1b]/10",
      color: "text-[#1a1e1b]",
      icon: "payments",
      trend: "up"
    },
    {
      title: "Peak Time",
      value: getPeakTimes(),
      change: "High staff requirement",
      bgColor: "bg-[#c4c7c3]/10",
      color: "text-[#c4c7c3]",
      icon: "schedule",
      trend: "neutral"
    }
  ]

  const paymentData = [
    { method: "Credit Card", percentage: 72, color: "bg-[#bb7336]" },
    { method: "Digital", percentage: 18, color: "bg-[#586152]" },
    { method: "Cash", percentage: 10, color: "bg-[#c4c7c3]" }
  ]

  const categoryData = getCategoryData()
  const popularItems = getPopularItems()

  const staffPerformance = [
    {
      name: "Elena Rossi",
      title: "Top Upseller",
      revenue: "$8,420",
      rank: 1
    },
    {
      name: "Julian Chen",
      title: "Fastest Turnaround",
      revenue: "$7,150",
      rank: 2
    },
    {
      name: "Sarah Miller",
      title: "Service Excellence",
      revenue: "$6,840",
      rank: 3
    }
  ]

  const occupancyData = [
    { day: "MON", hours: [20, 0, 40, 60, 80, 40] },
    { day: "WED", hours: [40, 30, 50, 80, 90, 60] },
    { day: "FRI", hours: [50, 40, 70, 95, 100, 80] },
    { day: "SUN", hours: [60, 80, 90, 80, 70, 50] }
  ]

  const chartData = [50, 60, 45, 70, 85, 90, 65, 55, 75, 80, 60, 95]

  return (
    <div className="min-h-screen bg-[#f7faf4]">
      <header className="bg-[#f1f5ef]/90 backdrop-blur-md fixed top-0 left-0 right-0 z-20 md:z-50 border-b border-[#c4c7c3]/50">
        <div className="flex items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="w-full flex justify-evenly items-center gap-8">
            <span className="text-2xl font-serif text-[#1a1e1b]">RestoFlow</span>
            <nav className="flex gap-6 font-serif text-sm tracking-wide">
              <span className="text-[#1a1e1b] font-semibold">Analytics</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-40 px-4 max-w-7xl mx-auto">
        <section className="mb-12">
          <div className="flex items-center justify-between w-full">
            
            <div className="flex items-center gap-4 w-full">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="bg-white rounded-lg border border-[#c4c7c3]/50 px-4 py-2 flex flex-col md:flex-row items-center gap-2">
                <span className="material-symbols-outlined text-[#586152] text-sm">calendar</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-sm text-[#1a1e1b] font-medium"
                >
                  <option value="1H">Last 1 Hour</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                  <option value="90D">Last 90 Days</option>
                </select>
              </div>
              
              {selectedPeriod === '1H' && (
                <div className="bg-white rounded-lg border border-[#c4c7c3]/50 px-4 py-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#586152] text-sm">schedule</span>
                  <input
                    type="datetime-local"
                    value={startDate.toISOString().slice(0, 16)}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="bg-transparent border-none focus:ring-0 text-sm text-[#1a1e1b] font-medium"
                  />
                </div>
              )}
              </div>
            </div>
              <button className="bg-[#bb7336] text-white px-4 py-2 rounded-lg hover:bg-[#9a5e2a] transition-colors flex items-center gap-2">
                refresh
              </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-[#c4c7c3]/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-label-caps tracking-widest uppercase text-[#586152] mb-1">{kpi.title}</p>
                  <h3 className="text-3xl font-serif text-[#1a1e1b] font-semibold">{kpi.value}</h3>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-[#586152]'
              }`}>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-2xl border border-[#c4c7c3]/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-xl font-serif text-[#1a1e1b] font-bold">Daily Sales Performance</h4>
                <p className="text-sm text-[#586152]">Revenue tracking over the last {selectedPeriod}</p>
              </div>
              <div className="flex bg-[#f7faf4] p-1 rounded-lg">
                {['7D', '30D', '90D', '1Y'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                      selectedPeriod === period 
                        ? 'bg-white text-[#1a1e1b] shadow-sm' 
                        : 'text-[#586152] hover:text-[#1a1e1b]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 flex items-end gap-1 relative">
              
              <div className="flex items-end gap-1 w-full px-2">
                {chartData.map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-[#bb7336]/20 border-t-2 border-[#bb7336] relative group cursor-pointer hover:bg-[#bb7336]/30 transition-colors"
                    style={{ height: `${height}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1e1b] text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">
                      ${(height * 425).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
           
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 25, 50, 75, 100].map((line) => (
                  <div key={line} className="w-full border-t border-[#c4c7c3]/20"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-2xl border border-[#c4c7c3]/50 shadow-sm">
            <h4 className="text-xl font-serif text-[#1a1e1b] font-bold mb-6">Payment Distribution</h4>
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 rounded-full border-[16px] border-[#f7faf4] flex items-center justify-center">
              
                <div className="absolute inset-[-16px] rounded-full border-[16px] border-[#bb7336]" 
                     style={{ 
                       clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 80%)',
                       transform: 'rotate(0deg)'
                     }}>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1a1e1b]">72%</p>
                  <p className="text-xs text-[#586152]">Credit Card</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-6">
              {paymentData.map((payment, index) => (
                <div key={index} className="text-center">
                  <div className={`w-2 h-2 rounded-full ${payment.color} mx-auto mb-1`}></div>
                  <p className="text-[10px] text-[#586152] uppercase">{payment.method}</p>
                  <p className="text-xs font-bold text-[#1a1e1b]">{payment.percentage}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-white p-8 rounded-2xl border border-[#c4c7c3]/50 shadow-sm">
            <h4 className="text-xl font-serif text-[#1a1e1b] font-bold mb-8">Top Selling Categories</h4>
            <div className="space-y-6">
              {categoryData.map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[#1a1e1b]">{category.name}</span>
                    <span className="text-[#586152]">{category.revenue}</span>
                  </div>
                  <div className="w-full bg-[#f7faf4] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#bb7336] h-full rounded-full transition-all duration-500"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 bg-white p-8 rounded-2xl border border-[#c4c7c3]/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-serif text-[#1a1e1b] font-bold">Table Occupancy Rates</h4>
              <div className="flex items-center gap-4 text-[10px] text-[#586152] font-medium">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-[#f7faf4] border border-[#c4c7c3]/50"></div>
                  0-20%
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-[#bb7336]/30"></div>
                  50%
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-[#bb7336]"></div>
                  100%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
        
              <div></div>
              {['12PM', '2PM', '4PM', '6PM', '8PM', '10PM'].map((hour) => (
                <div key={hour} className="text-[10px] text-center font-bold text-[#586152]">{hour}</div>
              ))}
             
              {occupancyData.map((day) => (
                <React.Fragment key={day.day}>
                  <div className="text-[10px] font-bold text-[#586152] flex items-center">{day.day}</div>
                  {day.hours.map((occupancy, hourIndex) => (
                    <div
                      key={hourIndex}
                      className={`h-8 rounded-lg transition-all duration-300 hover:ring-2 hover:ring-[#bb7336]/50 cursor-pointer ${
                        occupancy === 0 ? 'bg-[#f7faf4] border border-[#c4c7c3]/50' :
                        occupancy <= 40 ? 'bg-[#bb7336]/20' :
                        occupancy <= 60 ? 'bg-[#bb7336]/40' :
                        occupancy <= 80 ? 'bg-[#bb7336]/60' :
                        'bg-[#bb7336]'
                      }`}
                      title={`${occupancy}% occupancy`}
                    ></div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-[#c4c7c3]/50 shadow-sm overflow-hidden mb-12">
          <div className="p-8 border-b border-[#c4c7c3]/50 flex items-center justify-between">
            <h4 className="text-xl font-serif text-[#1a1e1b] font-bold">Popular Items</h4>
            <button className="text-[#bb7336] text-sm font-medium hover:underline">View All Menu</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f7faf4]/50">
                  <th className="px-8 py-4 text-left text-xs font-label-caps tracking-widest uppercase text-[#586152]">Item Name</th>
                  <th className="px-8 py-4 text-left text-xs font-label-caps tracking-widest uppercase text-[#586152]">Quantity Sold</th>
                  <th className="px-8 py-4 text-left text-xs font-label-caps tracking-widest uppercase text-[#586152]">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c7c3]/20">
                {popularItems.map((item, index) => (
                  <tr key={index} className="hover:bg-[#f7faf4]/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#f7faf4] overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f7faf4'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23c4c7c3' font-family='sans-serif' font-size='8'%3E{item.name}%3C/text%3E%3C/svg%3E"
                            }}
                          />
                        </div>
                        <span className="font-serif font-medium text-[#1a1e1b]">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-[#1a1e1b]">{item.quantity}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          parseInt(item.margin) >= 60 ? 'text-green-600' :
                          parseInt(item.margin) >= 40 ? 'text-amber-600' : 'text-[#586152]'
                        }`}>{item.margin}</span>
                        <div className="w-16 h-1 bg-[#f7faf4] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              parseInt(item.margin) >= 60 ? 'bg-green-500' :
                              parseInt(item.margin) >= 40 ? 'bg-amber-500' : 'bg-[#586152]'
                            }`}
                            style={{ width: `${item.margin}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#c4c7c3]/50 shadow-sm overflow-hidden mb-12">
          <div className="p-8 border-b border-[#c4c7c3]/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-serif text-[#1a1e1b] font-bold">Pending Orders</h4>
                <p className="text-sm text-[#586152] mt-1">Orders awaiting preparation ({pendingOrders.length} total)</p>
              </div>
              <button className="bg-[#bb7336] text-white px-4 py-2 rounded-lg hover:bg-[#9a5e2a] transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-[#c4c7c3]/20">
            {displayedOrders.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-xl font-serif text-[#1a1e1b] mb-2">No pending orders</h3>
                <p className="text-[#586152]">All orders have been completed</p>
              </div>
            ) : (
              <>
                {displayedOrders.map((order, index) => (
                  <div key={order.id} className="p-6 hover:bg-[#f7faf4]/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm font-medium text-[#1a1e1b]">Order #{order.id}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                          <span className="text-sm text-[#586152]">
                            {new Date(order.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-sm text-[#586152] mb-1">Items:</div>
                          <div className="flex flex-wrap gap-2">
                            {order.items?.slice(0, 3).map((item, itemIndex) => (
                              <span key={itemIndex} className="text-xs bg-[#f7faf4] px-2 py-1 rounded">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                            {order.items?.length > 3 && (
                              <span className="text-xs bg-[#f7faf4] px-2 py-1 rounded">
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {order.specialInstructions && (
                          <div className="text-sm text-[#bb7336] italic">
                            Note: {order.specialInstructions}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-[#1a1e1b]">
                          ${order.total?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-[#586152]">
                          {order.items?.length || 0} items
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMoreOrders && (
                  <div className="p-4 text-center">
                    <button
                      onClick={fetchMoreOrders}
                      className="bg-[#bb7336] text-white px-6 py-2 rounded-lg hover:bg-[#9a5e2a] transition-colors font-medium"
                    >
                      Fetch More Orders
                    </button>
                    <p className="text-xs text-[#586152] mt-2">
                      Showing {displayedOrders.length} of {pendingOrders.length} pending orders
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-[#c4c7c3]/50 shadow-sm">
          <h4 className="text-xl font-serif text-[#1a1e1b] font-bold mb-8">Waitstaff Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {staffPerformance.map((staff, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#f7faf4]/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#bb7336]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#bb7336]">Staff</span>
                    </div>
                    <div className={`absolute -top-1 -right-1 w-5 h-5 ${
                      index === 0 ? 'bg-[#bb7336]' : 
                      index === 1 ? 'bg-[#586152]' : 'bg-[#c4c7c3]'
                    } border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white`}>
                      {staff.rank}
                    </div>
                  </div>
                  <div>
                    <p className="font-serif font-medium text-[#1a1e1b]">{staff.name}</p>
                    <p className="text-[10px] text-[#586152] uppercase tracking-tighter">{staff.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1a1e1b]">{staff.revenue}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-[#c4c7c3]/50">
            {/* <button className="w-full py-3 rounded-xl border border-[#c4c7c3]/50 text-[#586152] font-medium text-sm hover:bg-[#f7faf4] transition-colors">
              View Full Team Report
            </button> */}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Analytics