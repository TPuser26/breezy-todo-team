import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskModal({ open, onOpenChange }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('todo')
  const [assignedTo, setAssignedTo] = useState('none')
  const [teamId, setTeamId] = useState('none')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
  })

  const { data: teamsData } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      return response.json()
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Tâche créée",
        description: "Votre nouvelle tâche a été créée avec succès !",
      })
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la tâche",
        variant: "destructive",
      })
    }
  })

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatus('todo')
    setAssignedTo('none')
    setTeamId('none')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est requis",
        variant: "destructive",
      })
      return
    }

    createTaskMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      assigned_to: assignedTo && assignedTo !== 'none' ? parseInt(assignedTo) : null,
      team_id: teamId && teamId !== 'none' ? parseInt(teamId) : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entrez le titre de la tâche"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre tâche (optionnel)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigner à</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun utilisateur</SelectItem>
                  {usersData?.users?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamId">Équipe</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune équipe</SelectItem>
                  {teamsData?.teams?.map((team: any) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'Création...' : 'Créer la tâche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}