import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './storage.provider';
import { Multer } from 'multer';

@Injectable()
export class StorageService {
  // We inject the Supabase client using the token we defined in the provider.
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Uploads a file to a specified Supabase storage bucket.
   * @param file The file to upload, following Express.Multer.File interface.
   * @param bucket The name of the bucket to upload to.
   * @param senderId The UUID of the user sending the file.
   * @param recipientId The UUID of the user receiving the file.
   * @returns The path of the uploaded file within the bucket.
   */
  public async upload(
    file: Express.Multer.File,
    bucket: string,
    senderId: string,
    recipientId: string,
  ): Promise<string> {
    // Create a unique file path to avoid name collisions.
    const filePath = `${senderId}/${Date.now()}-${file.originalname}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        // Metadata is crucial for your security policies.
        metadata: {
          senderId,
          recipientId,
        },
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    return data.path;
  }
}