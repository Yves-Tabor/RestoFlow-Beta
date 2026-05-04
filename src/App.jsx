import { useState, useEffect } from 'react'
import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import Welcome from './components/Welcome'
import TopLayout from './components/TopLayout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Track from './pages/Track'
import Orders from './pages/Orders'
import Stock from './pages/Stock'
import History from './pages/History'
import Analytics from './pages/Analytics'
import NotFound from './pages/NotFound'
import Error from './components/Error'
import MigrationModal from './components/MigrationModal'
import { useFirebase } from './hooks/useFirebase'

const welcomeLoader = async () => {
  try {
    const response = await fetch('/data.json')
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading welcome data:', error)
    throw error
  }
} 

const stockLoader = async () => {
  try {
    const response = await fetch('/stock.json')
    if (!response.ok) {
      throw new Error('Failed to fetch stock data')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading stock data:', error)
    throw error
  }
} 

const menuLoader = async () => {
  try {
    const response = await fetch('/menu.json')
    if (!response.ok) {
      throw new Error('Failed to fetch stock data')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading stock data:', error)
    throw error
  }
} 

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path='/' element={<Welcome/>} loader={welcomeLoader}/>
      <Route path='top' element={<TopLayout/>}>
        <Route index element={<Home/>} errorElement={<Error/>} loader={stockLoader} />
        <Route path="menu" element={<Menu/>} errorElement={<Error/>} loader={menuLoader} />
        <Route path="cart" element={<Cart/>} errorElement={<Error/>}>
          <Route path='summary'/>
          <Route path='track' element={<Track/>} errorElement={<Error/>}/>
        </Route>
        <Route path="orders" element={<Orders/>} errorElement={<Error/>} />
        <Route path="history" element={<History/>} errorElement={<Error/>} />
        <Route path="stock" element={<Stock/>} errorElement={<Error/>} loader={stockLoader} />
        <Route path="analytics" element={<Analytics/>} errorElement={<Error/>} />
      </Route>
      <Route path='*' element={<NotFound/>} />
    </Route>
  ),{
    hydrateFallback: <div>Loading ...</div>
  }
)

function AppWithFirebase() {
  const { needsMigration, isConnected } = useFirebase()
  const [showMigrationModal, setShowMigrationModal] = useState(false)

  useEffect(() => {
    if (needsMigration && isConnected) {
      setShowMigrationModal(true)
    }
  }, [needsMigration, isConnected])

  const handleMigrationComplete = () => {
    setShowMigrationModal(false)
  }

  return (
    <>
      <RouterProvider router={router}/>
      <MigrationModal 
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onMigrationComplete={handleMigrationComplete}
      />
    </>
  )
}

export default function App(){
  return <AppWithFirebase />
}