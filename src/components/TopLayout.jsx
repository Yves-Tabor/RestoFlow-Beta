import Header from './Header'
import { Outlet } from 'react-router-dom'

const TopLayout = () => {
  return (
    <>
        <Header/>
        <Outlet/>
    </>
  )
}

export default TopLayout;