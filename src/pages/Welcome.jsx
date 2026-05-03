import React from 'react'
import { useLoaderData } from 'react-router-dom'

const Welcome = () => {
  const data = useLoaderData()
  
  if (!data) {
    return (
      <div className="min-h-screen bg-[#1f1b17] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  const { restaurant, features } = data

  return (
    <main className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <img 
          alt="Signature dish at L'Artisan" 
          className="w-full h-full object-cover" 
          src={restaurant.heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(26,26,26,0.4)] to-[rgba(26,26,26,0.7)]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-[800px]">
        <div className="mb-8 flex flex-col items-center">
          <span className="text-[#fff8f4] mb-4 opacity-80" style={{fontSize: '48px'}}>🍽️</span>
          <h1 className="text-white font-serif text-[64px] tracking-tight mb-2 drop-shadow-lg">
           {restaurant.name}
          </h1>
          <div className="w-24 h-px bg-[#bb7336] mb-6 opacity-60"></div>
          <p className="text-[#fff8f4] text-lg opacity-90 max-w-md leading-relaxed tracking-wide">
            {restaurant.tagline}
          </p>
        </div>

        <div className="mt-12 group">
          <button className="relative flex flex-col items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer">
            <div className="bg-[#bb7336] text-white px-12 py-6 rounded-full text-base uppercase tracking-[0.2em] shadow-lg mb-4 flex items-center gap-3 hover:shadow-xl transition-shadow">
              Touch to Start
              <span className="text-[20px]">→</span>
            </div>
            
            <div className="flex items-center gap-6 mt-8">
              {features.map((feature, index) => (
                <React.Fragment key={feature.label}>
                  <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <span className="text-white mb-1" style={{fontSize: '24px'}}>{feature.icon}</span>
                    <span className="text-white text-[10px] uppercase font-semibold tracking-wider">{feature.label}</span>
                  </div>
                  {index < features.length - 1 && <div className="h-8 w-px bg-white opacity-20"></div>}
                </React.Fragment>
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end z-20">
        <div className="flex flex-col items-start">
          <p className="text-white text-[12px] opacity-60 mb-2 uppercase tracking-widest font-semibold">Current Table</p>
          <div className="flex items-center gap-2">
            <span className="text-[#bb7336]" style={{fontSize: '24px'}}>🍽️</span>
            <span className="text-white text-2xl font-medium">{restaurant.currentTable}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex flex-col items-end">
              <p className="text-white text-[12px] opacity-60 uppercase tracking-widest font-semibold">{restaurant.location}</p>
              <p className="text-white text-base">{restaurant.currentTime}</p>
            </div>
            <span className="text-[#bb7336]" style={{fontSize: '32px'}}>🕐</span>
          </div>
        </div>
      </div>

      {/* Border Frame */}
      <div className="absolute inset-0 pointer-events-none border-[32px] border-transparent">
        <div className="w-full h-full border border-white opacity-10"></div>
      </div>

      {/* Top Right Controls */}
      <div className="fixed top-8 right-8 z-50 flex gap-4">
        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all hover:bg-white/20">
          🌐
        </button>
        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all hover:bg-white/20">
          ♿
        </button>
      </div>
    </main>
  )
}

export default Welcome
