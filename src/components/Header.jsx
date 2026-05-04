import { useState, useEffect } from "react"
import { NavLink } from "react-router-dom"
import { useFirebase } from '../hooks/useFirebase'
import Popup from './Popup'

export default function Header() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [cartCount, setCartCount] = useState(0)
    const [showSyncButton, setShowSyncButton] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [showPopup, setShowPopup] = useState(false)
    const [popupMessage, setPopupMessage] = useState('')
    const [popupSubmessage, setPopupSubmessage] = useState('')
    const [popupType, setPopupType] = useState('success')
    const { saveStock } = useFirebase()
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setIsSidebarOpen(false)
    }

    const showSyncPopup = (message, submessage = '', type = 'success') => {
        setPopupMessage(message)
        setPopupSubmessage(submessage)
        setPopupType(type)
        setShowPopup(true)
        
        setTimeout(() => {
            setShowPopup(false)
        }, 3000)
    }

    useEffect(() => {
        const updateCartCount = () => {
            const savedCart = localStorage.getItem('restoflow-cart')
            if (savedCart) {
                const cart = JSON.parse(savedCart)
                const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0)
                setCartCount(totalItems)
            } else {
                setCartCount(0)
            }
        }

        const handleStockUpdated = () => {
            // Show sync button when stock is updated
            setShowSyncButton(true)
        }

        const syncToDatabase = async () => {
            try {
                setIsSyncing(true)
                const stockData = JSON.parse(localStorage.getItem('restoflow-stock') || '{}')
                await saveStock(stockData)
                setShowSyncButton(false)
                showSyncPopup('Stock Synced!', 'Successfully synced to database')
            } catch (error) {
                console.error('Sync failed:', error)
                showSyncPopup('Sync Failed', 'Failed to sync to database. Please try again.', 'error')
            } finally {
                setIsSyncing(false)
            }
        }

        updateCartCount()
        
        const handleStorageChange = () => {
            updateCartCount()
        }
        
        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('cartUpdated', handleStorageChange)
        window.addEventListener('stockUpdated', handleStockUpdated)
        
        // Make sync function available globally
        window.syncStockToDatabase = syncToDatabase
        
        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('cartUpdated', handleStorageChange)
            window.removeEventListener('stockUpdated', handleStockUpdated)
        }
    }, [])

    return (
        <>
            <button 
                onClick={toggleSidebar}
                className="md:hidden fixed top-1 left-4 z-50 bg-[#bb7336] text-white px-4 py-2 rounded-lg hover:bg-[#8b5c2a] transition-colors shadow-lg"
            >
                <span className="text-xl">{isSidebarOpen ? '✕' : '☰'}</span>
            </button>

            <aside className={`fixed left-0 top-0 h-full w-64 bg-orange-950 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}>
                <div className="p-6">
                    <NavLink 
                        to="/" 
                        className="flex items-center space-x-3 text-white font-bold text-2xl hover:text-[#bb7336] transition-colors mb-8"
                        onClick={closeSidebar}
                    >
                        <span className="text-3xl">RestoFlow</span>
                    </NavLink>
                    
                    <nav className="space-y-2">
                        <NavLink 
                            to="/top" 
                            end
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-md font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-md font-medium transition-colors"}
                        >
                            <span>Home</span>
                        </NavLink>

                        <NavLink 
                            to="/top/menu" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-md font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-md font-medium transition-colors"}
                        >
                            <span>Menu</span>
                        </NavLink>

                        <NavLink 
                            to="/top/cart" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-md font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-md font-medium transition-colors"}
                        >
                            <span>Cart</span>
                            {cartCount > 0 && (
                                <span className="bg-[#bb7336] text-white text-xs px-2 py-0.5 rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </NavLink>

                        <NavLink 
                            to="/top/orders" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-md font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-md font-medium transition-colors"}
                        >
                            <span>Orders</span>
                        </NavLink>

                        <NavLink 
                            to="/top/stock" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-md font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-md font-medium transition-colors"}
                        >
                            <span>Stock</span>
                        </NavLink>

                        <NavLink 
                            to="/top/analytics" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-lg font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"}
                        >
                            <span>Analytics</span>
                        </NavLink>

                        {showSyncButton && (
                            <button
                                onClick={() => {
                                    window.syncStockToDatabase()
                                    closeSidebar()
                                }}
                                disabled={isSyncing}
                                className="flex items-center space-x-3 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {isSyncing ? 'sync' : 'cloud_upload'}
                                </span>
                                <span>{isSyncing ? 'Syncing...' : 'Sync to Database'}</span>
                            </button>
                        )}
                    </nav>
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="border-t border-white/20 pt-4">
                            <div className="text-white/60 text-sm">
                                <p> 2026 RestoFlow</p>
                                <p className="text-xs mt-1">Restaurant Management System</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={closeSidebar}
                />
            )}
            
            {/* Sync Popup */}
            <Popup 
                show={showPopup}
                message={popupMessage}
                submessage={popupSubmessage}
                type={popupType}
            />
        </>
    )
}