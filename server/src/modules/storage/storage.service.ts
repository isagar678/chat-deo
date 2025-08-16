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
  ): Promise<{ path: string; url: string }> {
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
          originalName: file.originalname,
          size: file.size,
        },
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  }

  /**
   * Gets a signed URL for file download (for private files)
   * @param bucket The bucket name
   * @param filePath The file path in the bucket
   * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL for file download
   */
  public async getSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Gets the public URL for a file (for public files)
   * @param bucket The bucket name
   * @param filePath The file path in the bucket
   * @returns Public URL for the file
   */
  public getPublicUrl(bucket: string, filePath: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}