
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { Link } from 'wouter'
import { Plus, Users, ListTodo, Settings, Calendar } from 'lucide-react'

export function WelcomeSection() {
  const { user } = useAuth()
  const [showCreateTask, setShowCreateTask] = useState(false)

  // Fetch user tasks (prochaines tâches)
  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks', { credentials: 'include' })
      if (!res.ok) throw new Error('Erreur chargement tâches')
      return res.json()
    }
  })
  const nextTasks = (tasksData?.tasks || []).filter((t: any) => t.status !== 'completed').slice(0, 3)

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 py-12">
      <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl shadow-2xl px-8 py-10 max-w-xl w-full flex flex-col items-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 text-center drop-shadow-sm">
          Bonjour {user?.full_name?.split(' ')[0] || '👋'}
        </h1>
        <p className="text-lg text-gray-500 mb-6 text-center">
          Prêt à organiser votre journée ? <span className="text-blue-500 font-semibold">TaskFlow</span> vous accompagne.
        </p>
        <button
          onClick={() => setShowCreateTask(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg hover:scale-105 transition-all mb-8"
        >
          <Plus className="inline w-5 h-5 mr-2 -mt-1" /> Nouvelle tâche
        </button>
        <div className="w-full mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 text-left">À faire aujourd'hui</h2>
          {loadingTasks ? (
            <div className="text-gray-400 text-center py-4">Chargement...</div>
          ) : nextTasks.length === 0 ? (
            <div className="text-gray-400 text-center py-4">Aucune tâche à venir, profitez-en !</div>
          ) : (
            <ul className="space-y-2">
              {nextTasks.map((task: any) => (
                <li key={task.id} className="flex items-center bg-white/80 rounded-xl px-4 py-2 shadow-sm border border-gray-100">
                  <Calendar className="w-4 h-4 text-blue-400 mr-2" />
                  <span className="font-medium text-gray-700 flex-1 truncate">{task.title}</span>
                  <span className="ml-2 text-xs text-gray-400">{task.status === 'in_progress' ? 'En cours' : 'À faire'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-6 justify-center w-full mb-2">
          <Link href="/tasks">
            <button className="bg-gradient-to-br from-blue-200 to-blue-400 text-blue-700 rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-md hover:scale-110 transition-all">
              <ListTodo className="w-7 h-7 mb-1" />
              <span className="text-xs font-semibold">Tâches</span>
            </button>
          </Link>
          <Link href="/teams">
            <button className="bg-gradient-to-br from-green-200 to-green-400 text-green-700 rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-md hover:scale-110 transition-all">
              <Users className="w-7 h-7 mb-1" />
              <span className="text-xs font-semibold">Équipes</span>
            </button>
          </Link>
          <Link href="/settings">
            <button className="bg-gradient-to-br from-purple-200 to-purple-400 text-purple-700 rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-md hover:scale-110 transition-all">
              <Settings className="w-7 h-7 mb-1" />
              <span className="text-xs font-semibold">Profil</span>
            </button>
          </Link>
        </div>
        <div className="mt-8 text-xs text-gray-400 text-center">&copy; {new Date().getFullYear()} TaskFlow. Tous droits réservés.</div>
      </div>
      <CreateTaskModal open={showCreateTask} onOpenChange={setShowCreateTask} />
    </div>
  )
}
