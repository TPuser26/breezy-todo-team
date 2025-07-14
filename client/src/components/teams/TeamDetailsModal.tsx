import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Settings, Users, Crown, User, Trash2, Edit } from 'lucide-react'
import { TeamMemberSelect } from './TeamMemberSelect'

interface TeamDetailsModalProps {
  teamId: number
  teamName: string
  children: React.ReactNode
}

interface TeamMember {
  id: number
  user_id: number
  role: string
  joined_at: string
  user: {
    id: number
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export function TeamDetailsModal({ teamId, teamName, children }: TeamDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(teamName)
  const [editedDescription, setEditedDescription] = useState('')
  const queryClient = useQueryClient()

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['/api/teams', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch team details')
      }
      return response.json()
    },
    enabled: isOpen,
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
    enabled: isOpen,
  })

  const updateTeamMutation = useMutation({
    mutationFn: async (updates: { name?: string; description?: string }) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update team')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] })
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId] })
      toast.success('Équipe mise à jour avec succès')
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de l\'équipe')
    }
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update member role')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'members'] })
      toast.success('Rôle du membre mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du rôle')
    }
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove member')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'members'] })
      toast.success('Membre retiré de l\'équipe')
    },
    onError: () => {
      toast.error('Erreur lors du retrait du membre')
    }
  })

  const handleUpdateTeam = () => {
    updateTeamMutation.mutate({
      name: editedName,
      description: editedDescription
    })
  }

  const handleUpdateMemberRole = (userId: number, role: string) => {
    updateMemberRoleMutation.mutate({ userId, role })
  }

  const handleRemoveMember = (userId: number) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) {
      removeMemberMutation.mutate(userId)
    }
  }

  const team = teamData?.team
  const members = membersData?.members || []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestion de l'équipe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informations de l'équipe</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom de l'équipe</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Description de l'équipe"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateTeam}
                      disabled={updateTeamMutation.isPending}
                      size="sm"
                    >
                      {updateTeamMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      size="sm"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <strong>Nom:</strong> {team?.name || teamName}
                  </div>
                  <div>
                    <strong>Description:</strong> {team?.description || 'Aucune description'}
                  </div>
                  <div>
                    <strong>Créée le:</strong> {team?.created_at ? new Date(team.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membres ({members.length})
                </span>
                <TeamMemberSelect teamId={teamId} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member: TeamMember) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {member.user.full_name ? member.user.full_name[0].toUpperCase() : member.user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{member.user.full_name || member.user.email}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(role) => handleUpdateMemberRole(member.user_id, role)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Membre
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={removeMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}