import Header from './Header'
import { Outlet } from 'react-router-dom'

const TopLayout = () => {
  return (
    <>
        <Header/>
        <div className="md:ml-64 z-0">
            <Outlet/>
        </div>
    </>
  )
}

export default TopLayout;