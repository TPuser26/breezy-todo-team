import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/dashboard/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus, Calendar, User, Flag, Trash2, CheckCircle, Clock, Circle } from 'lucide-react'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskPrioritySelector } from '@/components/tasks/TaskPrioritySelector'
import { TaskComments } from '@/components/tasks/TaskComments';

export default function Tasks() {
  const [showCreateTask, setShowCreateTask] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    }
  })

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Utilisateur non connecté');
      return res.json();
    }
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number, status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] })
      toast({
        title: "Tâche mise à jour",
        description: "Le statut de la tâche a été modifié avec succès !",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la tâche",
        variant: "destructive",
      })
    }
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] })
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès !",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la tâche",
        variant: "destructive",
      })
    }
  })

  const tasks = tasksData?.tasks || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      todo: 'secondary',
      in_progress: 'default',
      completed: 'default'
    } as const

    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    }

    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      completed: 'Terminée'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }

    const labels = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Élevée'
    }

    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        <Flag className="w-3 h-3 mr-1" />
        {labels[priority as keyof typeof labels]}
      </Badge>
    )
  }

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({ taskId, status: newStatus })
  }

  const handleDeleteTask = (taskId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      deleteTaskMutation.mutate(taskId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Tâches</h1>
            <p className="text-gray-600 mt-2">Gérez et suivez toutes vos tâches</p>
          </div>
          <Button onClick={() => setShowCreateTask(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune tâche</h3>
              <p className="text-gray-600 mb-6">Créez votre première tâche pour commencer à organiser votre travail.</p>
              <Button onClick={() => setShowCreateTask(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer ma première tâche
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task: any) => (
              <Card key={task.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {task.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        {getStatusBadge(task.status)}
                        <TaskPrioritySelector 
                          taskId={task.id} 
                          currentPriority={task.priority}
                          onPriorityChange={() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(task.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {userData?.user?.id && (
                    <TaskComments taskId={task.id} currentUserId={userData.user.id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateTaskModal 
          open={showCreateTask} 
          onOpenChange={setShowCreateTask}
        />
      </main>
    </div>
  )
}