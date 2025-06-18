
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'
import { Task } from '@/types/database'
import { Plus, Search, Filter } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'

export function TaskList() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks()
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all')

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Grouper les tâches par statut
  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleFormSubmit = (taskData: any) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData)
    } else {
      createTask(taskData)
    }
    setEditingTask(null)
  }

  const handleStatusChange = (id: string, status: Task['status']) => {
    updateTask(id, { status })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Mes Tâches</h2>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher une tâche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colonnes de tâches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* À faire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>À faire</span>
              <span className="text-sm font-normal bg-gray-100 px-2 py-1 rounded">
                {tasksByStatus.todo.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.todo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={deleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus.todo.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune tâche à faire</p>
            )}
          </CardContent>
        </Card>

        {/* En cours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>En cours</span>
              <span className="text-sm font-normal bg-blue-100 px-2 py-1 rounded">
                {tasksByStatus.in_progress.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.in_progress.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={deleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus.in_progress.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune tâche en cours</p>
            )}
          </CardContent>
        </Card>

        {/* Terminé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Terminé</span>
              <span className="text-sm font-normal bg-green-100 px-2 py-1 rounded">
                {tasksByStatus.completed.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.completed.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={deleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus.completed.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune tâche terminée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formulaire de tâche */}
      <TaskForm
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingTask(null)
        }}
        onSubmit={handleFormSubmit}
        task={editingTask}
      />
    </div>
  )
}
