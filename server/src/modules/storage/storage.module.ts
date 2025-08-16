import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseProvider } from './storage.provider';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [StorageService, SupabaseProvider],
  exports: [StorageService],
})
export class StorageModule {}
