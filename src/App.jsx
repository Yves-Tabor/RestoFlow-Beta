import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import Welcome from './components/Welcome'
import TopLayout from './components/TopLayout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Stock from './pages/Stock'
import Analytics from './pages/Analytics'
import NotFound from './pages/NotFound'


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

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route index element={<Welcome/>} loader={welcomeLoader}/>
      <Route path='top' element={<TopLayout/>}>
        <Route index element={<Home/>} />
        <Route path="Menu" element={<Menu/>} />
        <Route path="cart" element={<Cart/>} />
        <Route path="stock" element={<Stock/>} />
        <Route path="analytics" element={<Analytics/>} />
      </Route>
      <Route path='*' element={<NotFound/>} />
    </Route>
  ),{
    hydrateFallback: <div>Loading ...</div>
  }
)
export default function App(){
  return (
    <RouterProvider router={router}/>
  )
}