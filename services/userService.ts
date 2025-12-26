
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

const mapUserFromSupabase = (data: any): User => ({
  id: data.id,
  slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || data.id,
  name: data.name || 'Anonymous',
  email: data.email || '',
  role: (data.role as UserRole) || (data.is_admin ? UserRole.Administrator : UserRole.Author),
  avatarUrl: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'A')}&background=random`,
});

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase Error (getAllUsers):', error);
      return [];
    }

    return data.map(mapUserFromSupabase);
  },

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase Error (getUserById):', error);
      return undefined;
    }

    return mapUserFromSupabase(data);
  },

  async getUserBySlug(slug: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
       // Try matching by name-based slug if explicit slug doesn't exist
       const { data: allUsers } = await supabase.from('profiles').select('*');
       const user = allUsers?.find(u => 
         (u.slug === slug) || 
         (u.name?.toLowerCase().replace(/\s+/g, '-') === slug)
       );
       return user ? mapUserFromSupabase(user) : undefined;
    }

    return mapUserFromSupabase(data);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const supabaseUpdates: any = {};
    if (updates.name) {
      supabaseUpdates.name = updates.name;
      supabaseUpdates.slug = updates.name.toLowerCase().replace(/\s+/g, '-');
    }
    if (updates.avatarUrl) supabaseUpdates.avatar_url = updates.avatarUrl;
    if (updates.role) supabaseUpdates.role = updates.role;

    const { data, error } = await supabase
      .from('profiles')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (updateUser):', error);
      throw error;
    }

    return mapUserFromSupabase(data);
  },
};