
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Calendar, Users, BarChart3 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { Link } from 'wouter'

export function WelcomeSection() {
  const { user } = useAuth()
  const [showCreateTask, setShowCreateTask] = useState(false)

  // Fetch user stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  })

  const statsCards = [
    { 
      label: 'Tâches actives', 
      value: isLoading ? '...' : (stats?.activeTasksCount || 0).toString(), 
      icon: Calendar, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Équipes', 
      value: isLoading ? '...' : (stats?.teamCount || 0).toString(), 
      icon: Users, 
      color: 'text-green-600' 
    },
    { 
      label: 'Complétées', 
      value: isLoading ? '...' : (stats?.completedTasksCount || 0).toString(), 
      icon: BarChart3, 
      color: 'text-purple-600' 
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Bonjour {user?.full_name?.split(' ')[0] || 'Utilisateur'} ! 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Voici un aperçu de vos projets et tâches du jour.
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateTask(true)}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 h-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all duration-200"
              onClick={() => setShowCreateTask(true)}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg mb-2"></div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Créer une tâche</p>
                <p className="text-xs text-gray-500">Nouvelle tâche collaborative</p>
              </div>
            </Button>
            
            <Link href="/teams">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all duration-200 w-full"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg mb-2"></div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Gérer équipes</p>
                  <p className="text-xs text-gray-500">Ajouter des collaborateurs</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/tasks">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all duration-200 w-full"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg mb-2"></div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Voir tâches</p>
                  <p className="text-xs text-gray-500">Analytics et métriques</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/settings">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all duration-200 w-full"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg mb-2"></div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Paramètres</p>
                  <p className="text-xs text-gray-500">Configuration du compte</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <CreateTaskModal 
        open={showCreateTask} 
        onOpenChange={setShowCreateTask}
      />
    </div>
  )
}
