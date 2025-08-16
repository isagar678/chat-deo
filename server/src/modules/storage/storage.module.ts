import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  imports:[ConfigModule,SupabaseClient],
  controllers: [],
  providers: [StorageService,SupabaseClient],
})
export class StorageModule {}
