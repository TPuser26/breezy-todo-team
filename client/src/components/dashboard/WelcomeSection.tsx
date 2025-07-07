
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Calendar, Users, BarChart3 } from 'lucide-react'

export function WelcomeSection() {
  const { profile } = useAuth()

  const stats = [
    { label: 'Tâches actives', value: '12', icon: Calendar, color: 'text-blue-600' },
    { label: 'Équipes', value: '3', icon: Users, color: 'text-green-600' },
    { label: 'Complétées', value: '48', icon: BarChart3, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Bonjour {profile?.full_name?.split(' ')[0] || 'Utilisateur'} ! 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Voici un aperçu de vos projets et tâches du jour.
            </p>
          </div>
          <Button 
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 h-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
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
            {[
              { title: 'Créer un projet', desc: 'Nouveau projet collaboratif', color: 'bg-blue-500' },
              { title: 'Inviter équipe', desc: 'Ajouter des collaborateurs', color: 'bg-green-500' },
              { title: 'Voir rapports', desc: 'Analytics et métriques', color: 'bg-purple-500' },
              { title: 'Paramètres', desc: 'Configuration du compte', color: 'bg-orange-500' },
            ].map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-8 h-8 ${action.color} rounded-lg mb-2`}></div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
