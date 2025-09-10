import { supabase } from './supabaseClient';

export interface EmergencyMOTD {
  id: string;
  enabled: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  show_on_main: boolean;
  created_at: string;
  updated_at: string;
}

export class EmergencyMOTDService {
  private static cachedMOTD: EmergencyMOTD | null = null;
  private static lastCheck: number = 0;
  private static readonly CACHE_DURATION = 1 * 60 * 1000; // 1 minute

  static async getEmergencyMOTD(): Promise<EmergencyMOTD | null> {
    const now = Date.now();
    
    // Return cached MOTD if still valid
    if (this.cachedMOTD && (now - this.lastCheck) < this.CACHE_DURATION) {
      return this.cachedMOTD;
    }

    try {
      const { data, error } = await supabase
        .from('emergency_motd')
        .select('*')
        .eq('enabled', true)
        .eq('show_on_main', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch emergency MOTD:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      this.cachedMOTD = data;
      this.lastCheck = now;
      return data;
    } catch (error) {
      console.error('Failed to fetch emergency MOTD:', error);
      
      // Return null on error (fail-safe - don't show MOTD if we can't verify it)
      return null;
    }
  }

  static clearCache(): void {
    this.cachedMOTD = null;
    this.lastCheck = 0;
  }

  // Admin function to update emergency MOTD (requires service role)
  static async updateEmergencyMOTD(
    enabled: boolean, 
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    showOnMain: boolean = true
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emergency_motd')
        .update({ 
          enabled, 
          title,
          message,
          type,
          show_on_main: showOnMain,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('emergency_motd').select('id').limit(1).single()).data?.id);

      if (error) {
        console.error('Failed to update emergency MOTD:', error);
        return false;
      }

      // Clear cache to force refresh
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating emergency MOTD:', error);
      return false;
    }
  }

  static async createEmergencyMOTD(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    enabled: boolean = true,
    showOnMain: boolean = true
  ): Promise<EmergencyMOTD | null> {
    try {
      const { data, error } = await supabase
        .from('emergency_motd')
        .insert({
          enabled,
          title,
          message,
          type,
          show_on_main: showOnMain
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create emergency MOTD:', error);
        return null;
      }

      // Clear cache to force refresh
      this.clearCache();
      return data;
    } catch (error) {
      console.error('Error creating emergency MOTD:', error);
      return null;
    }
  }

  static async disableEmergencyMOTD(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emergency_motd')
        .update({ 
          enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('enabled', true);

      if (error) {
        console.error('Failed to disable emergency MOTD:', error);
        return false;
      }

      // Clear cache to force refresh
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error disabling emergency MOTD:', error);
      return false;
    }
  }
}