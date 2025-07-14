import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, Flag } from 'lucide-react'

interface TaskPrioritySelectorProps {
  taskId: number
  currentPriority: 'low' | 'medium' | 'high'
  onPriorityChange?: (priority: string) => void
}

export function TaskPrioritySelector({ taskId, currentPriority, onPriorityChange }: TaskPrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      const response = await fetch(`/api/tasks/${taskId}/priority`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ priority }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update priority')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })
      toast.success('Priorité mise à jour avec succès')
      setIsOpen(false)
      if (onPriorityChange) {
        onPriorityChange
      }
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la priorité')
    }
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Élevée'
      case 'medium':
        return 'Moyenne'
      case 'low':
        return 'Faible'
      default:
        return 'Moyenne'
    }
  }

  const handlePriorityChange = (priority: string) => {
    updatePriorityMutation.mutate(priority)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-auto p-1 hover:bg-gray-50"
        disabled={updatePriorityMutation.isPending}
      >
        <Badge 
          variant="outline" 
          className={`${getPriorityColor(currentPriority)} flex items-center gap-1`}
        >
          <Flag className="h-3 w-3" />
          {getPriorityLabel(currentPriority)}
          <ChevronDown className="h-3 w-3" />
        </Badge>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[120px]">
          <div className="p-1">
            {(['high', 'medium', 'low'] as const).map((priority) => (
              <Button
                key={priority}
                variant="ghost"
                size="sm"
                onClick={() => handlePriorityChange(priority)}
                className="w-full justify-start hover:bg-gray-50 p-2"
              >
                <Badge 
                  variant="outline" 
                  className={`${getPriorityColor(priority)} flex items-center gap-1`}
                >
                  <Flag className="h-3 w-3" />
                  {getPriorityLabel(priority)}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}