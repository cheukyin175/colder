import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'http://127.0.0.1:54321';
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    // Use service role key for backend operations
    // If not available, fall back to anon key (though service role is preferred for backend)
    const supabaseKey = supabaseServiceKey ||
                       this.configService.get<string>('SUPABASE_ANON_KEY') ||
                       'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Verify a Supabase JWT token and get the user
   */
  async getUserFromToken(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }

    return user;
  }
}