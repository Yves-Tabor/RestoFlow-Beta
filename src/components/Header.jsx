import { useState } from "react"
import { NavLink } from "react-router-dom"

export default function Header() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setIsSidebarOpen(false)
    }

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
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-lg font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"}
                        >
                            <span>Home</span>
                        </NavLink>

                        <NavLink 
                            to="/top/menu" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-lg font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"}
                        >
                            <span>Menu</span>
                        </NavLink>

                        <NavLink 
                            to="/top/cart" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-lg font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"}
                        >
                            <span>Cart</span>
                        </NavLink>

                        <NavLink 
                            to="/top/stock" 
                            onClick={closeSidebar}
                            className={({isActive})=> isActive ? "flex items-center space-x-3 text-[#bb7336] bg-black/25 px-4 py-3 rounded-lg font-medium" : "flex items-center space-x-3 text-white hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition-colors"}
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

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={closeSidebar}
                />
            )}
        </>
    )
}