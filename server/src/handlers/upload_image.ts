
import { db } from '../db';
import { imageUploadsTable, usersTable } from '../db/schema';
import { type UploadImageInput, type ImageUpload } from '../schema';
import { eq } from 'drizzle-orm';

export const uploadImage = async (input: UploadImageInput): Promise<ImageUpload> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Insert image upload record
    const result = await db.insert(imageUploadsTable)
      .values({
        user_id: input.user_id,
        original_filename: input.original_filename,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        upload_status: 'pending'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};
