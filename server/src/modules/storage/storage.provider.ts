import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This is the injection token we will use to inject the Supabase client
// into our services. It's a best practice to use a constant for this.
export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

export const SupabaseProvider: Provider = {
  provide: SUPABASE_CLIENT,
  useFactory: (configService: ConfigService): SupabaseClient => {
    // This factory function creates and returns the Supabase client instance.
    // It uses the ConfigService to safely access your environment variables.
    return createClient(
      configService.get<string>('SUPABASE_URL') || '',
      configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          persistSession: false,
        },
      },
    );
  },
  // We tell NestJS that our factory depends on the ConfigService.
  inject: [ConfigService],
};