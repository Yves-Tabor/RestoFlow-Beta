import React from 'react'

const Popup = ({ show, message, submessage, type = 'success' }) => {
  if (!show) return null

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-[#1a1e1b] text-white'
      case 'error':
        return 'bg-red-600 text-white'
      case 'info':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-[#1a1e1b] text-white'
    }
  }

  return (
    <div className="fixed top-20 right-4 bg-[#1a1e1b] text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-pulse">
      <div className="flex items-center gap-3">
        <div>
          <p className="font-semibold">{message}</p>
          {submessage && <p className="text-sm text-gray-300">{submessage}</p>}
        </div>
      </div>
    </div>
  )
}

export default Popup
