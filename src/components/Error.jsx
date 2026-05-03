import { useRouteError, Link } from 'react-router-dom'

const Error = () => {
  const error = useRouteError()
  
  return (
    <div className="min-h-screen bg-[#f7faf4] flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#1a1e1b] mb-4">Something went wrong !</h1>
          <p className="text-lg text-[#586152] mb-8">
            Please try again or return to the dashboard.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
          <h2 className="font-serif text-lg text-[#1a1e1b] mb-4">Error Details</h2>
          <div className="text-left">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Status:</span> {error.status || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Message:</span> {error.message || 'No error message available'}
            </p>
            {error.statusText && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status Text:</span> {error.statusText}
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/top"
            className="inline-block bg-[#1a1e1b] text-white px-6 py-3 rounded-lg hover:bg-[#2a2e2b] transition-colors duration-200 font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-[#c4c7c3]/10">
          <p className="text-sm text-[#586152]">
            If this problem persists, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Error