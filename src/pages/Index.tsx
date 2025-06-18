
import { useAuth } from '@/hooks/useAuth'
import Dashboard from './Dashboard'
import Auth from './Auth'

const Index = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded animate-spin"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">TaskFlow</h2>
          <p className="text-gray-600">Chargement de votre espace de travail...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <Auth />
}

export default Index
