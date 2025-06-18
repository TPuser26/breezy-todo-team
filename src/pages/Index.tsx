
import { useAuth } from '@/hooks/useAuth'
import Dashboard from './Dashboard'
import Auth from './Auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const Index = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <LoadingSpinner size="default" />
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
