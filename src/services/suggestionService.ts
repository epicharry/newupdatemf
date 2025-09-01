import { supabase, supabaseAdmin } from './supabaseClient';

export interface Suggestion {
  id: string;
  puuid: string;
  message: string;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  created_at: string;
  updated_at: string;
}

export class SuggestionService {
  static async createSuggestion(puuid: string, message: string): Promise<Suggestion | null> {
    try {
      // Use service role client if available, otherwise use regular client
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from('suggestions')
        .insert({
          puuid,
          message: message.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create suggestion:', error);
        throw new Error('Failed to submit suggestion');
      }

      return data;
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  }

  static async getUserSuggestions(puuid: string): Promise<Suggestion[]> {
    try {
      // Use service role client if available, otherwise use regular client
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from('suggestions')
        .select('*')
        .eq('puuid', puuid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get user suggestions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user suggestions:', error);
      return [];
    }
  }

  static async getAllSuggestions(): Promise<Suggestion[]> {
    try {
      // Only service role can access all suggestions
      if (!supabaseAdmin) {
        throw new Error('Service role required for this operation');
      }
      
      const { data, error } = await supabaseAdmin
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get all suggestions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all suggestions:', error);
      return [];
    }
  }

  static async updateSuggestionStatus(
    suggestionId: string, 
    status: 'pending' | 'reviewed' | 'implemented' | 'rejected'
  ): Promise<boolean> {
    try {
      // Only service role can update suggestion status
      if (!supabaseAdmin) {
        throw new Error('Service role required for this operation');
      }
      
      const { error } = await supabaseAdmin
        .from('suggestions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) {
        console.error('Failed to update suggestion status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      return false;
    }
  }
}