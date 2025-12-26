
import { supabase } from '../lib/supabase';

export const newsletterService = {
  async subscribe(email: string): Promise<void> {
    const { data: existing, error: checkError } = await supabase
      .schema('blog')
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new Error('This email is already subscribed.');
    }

    const { error } = await supabase
      .schema('blog')
      .from('newsletter_subscribers')
      .insert([{ email, source: 'website' }]);

    if (error) {
      console.error('Supabase Error (subscribe):', error);
      throw error;
    }
  },

  async getAllSubscribers(): Promise<string[]> {
    const { data, error } = await supabase
      .schema('blog')
      .from('newsletter_subscribers')
      .select('email');

    if (error) {
      console.error('Supabase Error (getAllSubscribers):', error);
      return [];
    }

    return data.map(s => s.email);
  }
};
