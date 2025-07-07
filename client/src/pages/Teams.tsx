import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/dashboard/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Users, Calendar, UserPlus, Settings, Crown, User } from 'lucide-react'

interface Team {
  id: number
  name: string
  description: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export default function Teams() {
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch teams
  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch teams')
      return response.json()
    }
  })

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: { name: string, description: string }) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(teamData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create team')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] })
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] })
      setShowCreateTeam(false)
      setTeamName('')
      setTeamDescription('')
      toast({
        title: "Équipe créée",
        description: "Votre nouvelle équipe a été créée avec succès !",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'équipe",
        variant: "destructive",
      })
    }
  })

  const teams = teamsData?.teams || []

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'équipe est requis",
        variant: "destructive",
      })
      return
    }

    createTeamMutation.mutate({
      name: teamName.trim(),
      description: teamDescription.trim() || ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Équipes</h1>
            <p className="text-gray-600 mt-2">Gérez vos équipes et collaborez efficacement</p>
          </div>
          <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle équipe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle équipe</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Nom de l'équipe</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Mon équipe géniale"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamDescription">Description (optionnel)</Label>
                  <Textarea
                    id="teamDescription"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Description de votre équipe..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateTeam(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createTeamMutation.isPending}>
                    {createTeamMutation.isPending ? 'Création...' : 'Créer l\'équipe'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
        ) : teams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune équipe</h3>
              <p className="text-gray-600 mb-6">Créez votre première équipe pour commencer à collaborer.</p>
              <Button onClick={() => setShowCreateTeam(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer ma première équipe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team: Team) => (
              <Card key={team.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {team.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Créateur
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {team.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {team.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Membres</span>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">1</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Créée le</span>
                      <span className="text-gray-700">
                        {new Date(team.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Inviter
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        Tâches
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}