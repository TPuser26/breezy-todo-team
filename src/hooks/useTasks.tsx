
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Task, TaskInsert, TaskUpdate } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Récupérer les tâches initiales
  const fetchTasks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des tâches:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Créer une tâche
  const createTask = async (taskData: Omit<TaskInsert, 'user_id'>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
        })

      if (error) throw error
      
      toast({
        title: "Succès",
        description: "Tâche créée avec succès",
      })
    } catch (error) {
      console.error('Erreur lors de la création de la tâche:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive",
      })
    }
  }

  // Mettre à jour une tâche
  const updateTask = async (id: string, updates: TaskUpdate) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      toast({
        title: "Succès",
        description: "Tâche mise à jour avec succès",
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive",
      })
    }
  }

  // Supprimer une tâche
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès",
      })
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      })
    }
  }

  // Configurer les abonnements en temps réel
  useEffect(() => {
    if (!user) return

    fetchTasks()

    // Abonnement aux changements en temps réel
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Nouvelle tâche ajoutée:', payload.new)
          setTasks((current) => [payload.new as Task, ...current])
          toast({
            title: "Nouvelle tâche",
            description: `"${(payload.new as Task).title}" a été ajoutée`,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Tâche mise à jour:', payload.new)
          setTasks((current) =>
            current.map((task) =>
              task.id === payload.new.id ? (payload.new as Task) : task
            )
          )
          toast({
            title: "Tâche mise à jour",
            description: `"${(payload.new as Task).title}" a été modifiée`,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Tâche supprimée:', payload.old)
          setTasks((current) =>
            current.filter((task) => task.id !== payload.old.id)
          )
          toast({
            title: "Tâche supprimée",
            description: `"${(payload.old as Task).title}" a été supprimée`,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
  }
}
