
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types/database'
import { Calendar, Clock, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Task['status']) => void
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

const statusLabels = {
  todo: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminé',
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

const priorityLabels = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const nextStatus = {
    todo: 'in_progress' as const,
    in_progress: 'completed' as const,
    completed: 'todo' as const,
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg text-gray-900 flex-1">{task.title}</h3>
          <div className="flex gap-2 ml-2">
            <Badge className={statusColors[task.status]} variant="secondary">
              {statusLabels[task.status]}
            </Badge>
            <Badge className={priorityColors[task.priority]} variant="secondary">
              {priorityLabels[task.priority]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-gray-600 text-sm">{task.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Créé le {format(new Date(task.created_at), 'dd MMM yyyy', { locale: fr })}</span>
          </div>
          
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Échéance: {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Button 
            onClick={() => onStatusChange(task.id, nextStatus[task.status])}
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            {task.status === 'completed' ? 'Rouvrir' : 'Avancer'}
          </Button>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => onEdit(task)}
              variant="ghost" 
              size="sm"
              className="p-2"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={() => onDelete(task.id)}
              variant="ghost" 
              size="sm"
              className="p-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
