
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Task, TaskInsert, TaskUpdate } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      console.log('Fetching tasks for user:', user.id)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
      console.log('Tasks loaded:', data?.length || 0)
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
  }, [user])

  // Memoize CRUD operations
  const createTask = useCallback(async (taskData: Omit<TaskInsert, 'user_id'>) => {
    if (!user) return

    try {
      console.log('Creating task:', taskData.title)
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
  }, [user])

  const updateTask = useCallback(async (id: string, updates: TaskUpdate) => {
    try {
      console.log('Updating task:', id, updates)
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
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    try {
      console.log('Deleting task:', id)
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
  }, [])

  // Set up real-time subscriptions only once
  useEffect(() => {
    if (!user) return

    console.log('Setting up real-time subscriptions for user:', user.id)
    fetchTasks()

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
          console.log('Real-time: Task inserted', payload.new)
          setTasks((current) => [payload.new as Task, ...current])
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
          console.log('Real-time: Task updated', payload.new)
          setTasks((current) =>
            current.map((task) =>
              task.id === payload.new.id ? (payload.new as Task) : task
            )
          )
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
          console.log('Real-time: Task deleted', payload.old)
          setTasks((current) =>
            current.filter((task) => task.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up real-time subscriptions')
      supabase.removeChannel(channel)
    }
  }, [user, fetchTasks])

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
  }), [tasks, loading, createTask, updateTask, deleteTask])
}
