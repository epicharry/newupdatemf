import { supabase } from './supabaseClient';

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

export class MaintenanceService {
  private static cachedStatus: MaintenanceStatus | null = null;
  private static lastCheck: number = 0;
  private static readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  static async checkMaintenanceStatus(): Promise<MaintenanceStatus> {
    const now = Date.now();
    
    // Return cached status if still valid
    if (this.cachedStatus && (now - this.lastCheck) < this.CACHE_DURATION) {
      return this.cachedStatus;
    }

    try {
      const { data, error } = await supabase
        .from('maintenance_status')
        .select('enabled, message')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Failed to check maintenance status:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      this.cachedStatus = {
        enabled: data.enabled === true,
        message: data.message || 'System maintenance in progress. Please try again later.'
      };
      
      this.lastCheck = now;
      return this.cachedStatus;
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      
      // Return default enabled status on error (fail-safe)
      const defaultStatus: MaintenanceStatus = {
        enabled: true, // Allow app to work if we can't check maintenance
        message: 'Unable to check maintenance status. Continuing with normal operation.'
      };
      
      return defaultStatus;
    }
  }

  static clearCache(): void {
    this.cachedStatus = null;
    this.lastCheck = 0;
  }

  // Admin function to update maintenance status (requires service role)
  static async updateMaintenanceStatus(enabled: boolean, message: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('maintenance_status')
        .update({ 
          enabled, 
          message,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('maintenance_status').select('id').limit(1).single()).data?.id);

      if (error) {
        console.error('Failed to update maintenance status:', error);
        return false;
      }

      // Clear cache to force refresh
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      return false;
    }
  }
}