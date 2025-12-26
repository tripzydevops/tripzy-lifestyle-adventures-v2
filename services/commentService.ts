
import { Comment } from '../types';
import { supabase } from '../lib/supabase';

const mapCommentFromSupabase = (data: any): Comment => ({
  id: data.id,
  postId: data.post_id,
  authorName: data.author_name || 'Anonymous',
  content: data.content,
  createdAt: data.created_at,
});

export const commentService = {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*', { schema: 'blog' })
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error (getCommentsByPostId):', error);
      return [];
    }

    return data.map(mapCommentFromSupabase);
  },

  async addComment(postId: string, authorName: string, content: string): Promise<Comment> {
    const supabaseData = {
      post_id: postId,
      author_name: authorName,
      content: content,
      is_approved: true, // Auto-approve for now, can be changed later
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([supabaseData], { schema: 'blog' })
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (addComment):', error);
      throw error;
    }

    return mapCommentFromSupabase(data);
  },
};
