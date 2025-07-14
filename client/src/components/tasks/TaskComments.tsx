import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TaskCommentsProps {
  taskId: number;
  currentUserId: number;
}

export function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data, isLoading } = useQuery({
    queryKey: ['/api/tasks', taskId, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur lors du chargement des commentaires');
      return res.json();
    }
  });

  // Add comment
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de l\'ajout du commentaire');
      }
      return res.json();
    },
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'comments'] });
      toast({ title: 'Commentaire ajouté' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'comments'] });
      toast({ title: 'Commentaire supprimé' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addCommentMutation.mutate(content.trim());
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Commentaires</h4>
      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <div className="space-y-2 mb-4">
          {data?.comments?.length === 0 && <div className="text-gray-500 text-sm">Aucun commentaire</div>}
          {data?.comments?.map((comment: any) => (
            <div key={comment.id} className="bg-gray-100 rounded p-2 flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-1">
                  Par utilisateur #{comment.user_id} le {new Date(comment.created_at).toLocaleString('fr-FR')}
                </div>
                <div className="text-sm">{comment.content}</div>
              </div>
              {comment.user_id === currentUserId && (
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteCommentMutation.mutate(comment.id)}>
                  Supprimer
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAddComment} className="flex flex-col gap-2">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Ajouter un commentaire..."
          rows={2}
        />
        <Button type="submit" disabled={addCommentMutation.isPending || !content.trim()}>
          Ajouter
        </Button>
      </form>
    </div>
  );
} 