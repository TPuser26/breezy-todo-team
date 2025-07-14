import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, UserPlus } from 'lucide-react'

interface TeamMemberSelectProps {
  teamId: number
  onMemberAdded?: () => void
}

interface User {
  id: number
  email: string
  full_name: string | null
  avatar_url: string | null
}

export function TeamMemberSelect({ teamId, onMemberAdded }: TeamMemberSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('member')
  const queryClient = useQueryClient()

  const { data: usersData, isLoading: usersLoading } = useQuery({
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

  const { data: membersData } = useQuery({
    queryKey: ['/api/teams', teamId, 'members'],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      return response.json()
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId: parseInt(selectedUserId), 
          role: selectedRole 
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add member')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId] })
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'members'] })
      toast.success('Membre ajouté avec succès')
      setIsOpen(false)
      setSelectedUserId('')
      setSelectedRole('member')
      if (onMemberAdded) {
        onMemberAdded()
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout du membre')
    }
  })

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur')
      return
    }
    addMemberMutation.mutate()
  }

  const users = usersData?.users || []
  const members = membersData?.members || []
  const memberUserIds = members.map((member: any) => member.user_id)
  const availableUsers = users.filter((user: User) => !memberUserIds.includes(user.id))

  console.log('TeamMemberSelect Debug:', {
    users,
    members,
    memberUserIds,
    availableUsers,
    usersData,
    membersData
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Ajouter un membre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Sélectionner un utilisateur
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    Aucun utilisateur disponible
                  </div>
                ) : (
                  availableUsers.map((user: User) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || user.email}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Rôle
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membre</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAddMember}
              disabled={!selectedUserId || addMemberMutation.isPending}
              className="flex-1"
            >
              {addMemberMutation.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}