import React from 'react'
import { Link, useLoaderData } from 'react-router-dom'

const Welcome = () => {
  const data = useLoaderData()
  
  if (!data) {
    return (
      <div className="min-h-screen bg-[#1f1b17] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  const { restaurant, features, uiIcons } = data

  return (
    <main className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <img 
          alt="Restaurant Image Loading ..." 
          className="w-full h-full object-cover" 
          loading='lazy'
          src={restaurant.heroImage}
        />
        <div className="absolute inset-1 bg-gradient-to-b from-[rgba(26,26,26,0.7)] to-[rgba(26,26,26,0.8)]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-[800px]">
        <div className="mb-8 flex flex-col items-center">
          {/* <img 
            src={uiIcons.restaurant} 
            alt="Restaurant" 
            className="mb-4 opacity-80"
            style={{width: '48px', height: '48px'}}
          /> */}
          <h1 className="text-white font-serif text-[64px] tracking-tight mb-2 drop-shadow-lg">
           {restaurant.name}
          </h1>
          <div className="w-24 h-px bg-[#bb7336] mb-6 opacity-60"></div>
          <p className="text-[#fff8f4] text-lg font-semibold italic opacity-90 max-w-md leading-relaxed tracking-wide">
            {restaurant.tagline}
          </p>
        </div>

        <div className="mt-12 group">
          <button className="relative flex flex-col items-center justify-center transition-all duration-400 hover:scale-105 active:scale-95 cursor-pointer">
            <Link to="top" className="bg-orange-900 text-white font-semibold px-10 py-4 rounded-md text-sm uppercase tracking-[0.2em] shadow-lg mb-4 flex items-center gap-3 hover:shadow-xl transition-shadow">
              Touch to Start
              <span className="text-[20px]">→</span>
            </Link>
            
            <div className="flex items-center gap-6 mt-8">
              {features.map((feature, index) => (
                <React.Fragment key={feature.label}>
                  <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <img 
                    src={feature.icon} 
                    alt={feature.label}
                    className="mb-1 opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{width: '24px', height: '24px'}}
                  />
                    <span className="text-white text-[10px] uppercase font-semibold tracking-wider">{feature.label}</span>
                  </div>
                  {index < features.length - 1 && <div className="h-8 w-px bg-white opacity-20"></div>}
                </React.Fragment>
              ))}
            </div>
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end z-20">
        <div className="flex flex-col items-start">
          <p className="text-white text-[12px] px-3 mb-2 uppercase tracking-widest font-semibold"> + Table Booking</p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex flex-col items-end">
              <p className="text-white text-[12px] opacity-70 px-3 uppercase tracking-widest font-semibold">{restaurant.location}</p>
              {/* <p className="text-white text-base">{restaurant.currentTime}</p> */}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none border-[32px] border-transparent">
        <div className="w-full h-full border border-white opacity-10"></div>
      </div>

      <div className="fixed top-8 right-8 z-50 flex gap-4 p-[1%]">
        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all hover:bg-white/20">
          <p>EN</p>
        </button>
        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all hover:bg-white/20">
          <p>KN</p>
        </button>
      </div>
    </main>
  )
}

export default Welcome