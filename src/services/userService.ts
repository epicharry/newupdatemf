import { supabase, supabaseAdmin, User, UserLog } from './supabaseClient';
import { ValorantTokens } from '../types/valorant';

export interface UserInfo {
  puuid: string;
  gameName?: string;
  tagLine?: string;
  country?: string;
  email?: string;
  preferredUsername?: string;
  playerLocale?: string;
  emailVerified?: boolean;
  phoneNumberVerified?: boolean;
  accountType?: number;
  accountState?: string;
  accountCreatedAt?: number;
  countryAt?: number;
  passwordChangedAt?: number;
  passwordMustReset?: boolean;
}

export class UserService {
  static async logUserAction(
    puuid: string, 
    action: string, 
    metadata?: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      const userAgent = navigator.userAgent;
      
      // Use service role client if available, otherwise use regular client
      const client = supabaseAdmin || supabase;
      
      const { error } = await client
        .from('user_logs')
        .insert({
          puuid,
          action,
          user_agent: userAgent,
          ip_address: ipAddress,
          metadata
        });

      if (error) {
        console.error('Failed to log user action:', error);
      }
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  static async getUserIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (response.ok) {
        const data = await response.json();
        return data.ip;
      }
    } catch (error) {
      console.error('Failed to get user IP:', error);
    }
    return null;
  }

  static async getUserInfo(authToken: string): Promise<UserInfo | null> {
    try {
      const response = await window.electronAPI.makeRequest({
        url: 'https://auth.riotgames.com/userinfo',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        method: 'GET'
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        
        return {
          puuid: data.sub,
          gameName: data.acct?.game_name,
          tagLine: data.acct?.tag_line,
          country: data.country,
          email: data.email || data.username, // Fallback to username if email not available
          preferredUsername: data.preferred_username,
          playerLocale: data.player_locale,
          emailVerified: data.email_verified || false,
          phoneNumberVerified: data.phone_number_verified || false,
          accountType: data.acct?.type || 0,
          accountState: data.acct?.state || 'ENABLED',
          accountCreatedAt: data.acct?.created_at,
          countryAt: data.country_at,
          passwordChangedAt: data.pw?.cng_at,
          passwordMustReset: data.pw?.must_reset || false
        };
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
    }
    
    return null;
  }

  static async saveOrUpdateUser(userInfo: UserInfo): Promise<User | null> {
    try {
      // Use service role client if available, otherwise use regular client
      const client = supabaseAdmin || supabase;
      
      const userData = {
        puuid: userInfo.puuid,
        game_name: userInfo.gameName,
        tag_line: userInfo.tagLine,
        country: userInfo.country,
        email: userInfo.email,
        preferred_username: userInfo.preferredUsername,
        player_locale: userInfo.playerLocale,
        email_verified: userInfo.emailVerified || false,
        phone_number_verified: userInfo.phoneNumberVerified || false,
        account_type: userInfo.accountType || 0,
        account_state: userInfo.accountState || 'ENABLED',
        account_created_at: userInfo.accountCreatedAt ? new Date(userInfo.accountCreatedAt).toISOString() : null,
        country_at: userInfo.countryAt ? new Date(userInfo.countryAt).toISOString() : null,
        password_changed_at: userInfo.passwordChangedAt ? new Date(userInfo.passwordChangedAt).toISOString() : null,
        password_must_reset: userInfo.passwordMustReset || false,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('users')
        .upsert(userData, {
          onConflict: 'puuid'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving user:', error);
      return null;
    }
  }

  static async checkUserBanStatus(puuid: string): Promise<{ isBanned: boolean; reason?: string }> {
    try {
      // Use service role client if available, otherwise use regular client
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from('users')
        .select('is_banned, ban_reason')
        .eq('puuid', puuid)
        .single();

      if (error) {
        // If it's a 401 error and we don't have service role, that's expected
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          console.warn('No service role key available, skipping ban check');
          return { isBanned: false };
        }
        console.error('Failed to check ban status:', error);
        return { isBanned: false };
      }

      return {
        isBanned: data?.is_banned || false,
        reason: data?.ban_reason || undefined
      };
    } catch (error) {
      console.error('Error checking ban status:', error);
      return { isBanned: false };
    }
  }

  static async initializeUser(tokens: ValorantTokens): Promise<{
    user: User | null;
    isBanned: boolean;
    banReason?: string;
  }> {
    try {
      // First, test database connection
      try {
        const { error: connectionError } = await supabase.from('users').select('puuid').limit(1);
        if (connectionError) {
          throw new Error('Database connection failed');
        }
      } catch (dbError) {
        console.error('Database connection test failed:', dbError);
        throw new Error('Unable to connect to database. App cannot function without database access.');
      }

      // Get user info from Riot
      const userInfo = await this.getUserInfo(tokens.authToken);
      
      if (!userInfo) {
        throw new Error('Failed to get user information');
      }

      // Get user's IP address
      const ipAddress = await this.getUserIP();

      // Log the app launch
      await this.logUserAction(userInfo.puuid, 'app_launch', {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        userInfo: {
          country: userInfo.country,
          accountState: userInfo.accountState,
          emailVerified: userInfo.emailVerified,
          phoneVerified: userInfo.phoneNumberVerified
        }
      }, ipAddress || undefined);

      // Save or update user in database
      const user = await this.saveOrUpdateUser(userInfo);

      // Check ban status
      const banStatus = await this.checkUserBanStatus(userInfo.puuid);

      if (banStatus.isBanned) {
        await this.logUserAction(userInfo.puuid, 'banned_access_attempt', {
          reason: banStatus.reason
        }, ipAddress || undefined);
      }

      return {
        user,
        isBanned: banStatus.isBanned,
        banReason: banStatus.reason
      };
    } catch (error) {
      console.error('Failed to initialize user:', error);
      return {
        user: null,
        isBanned: false
      };
    }
  }
}