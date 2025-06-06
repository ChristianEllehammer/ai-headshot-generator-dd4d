
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imageUploadsTable } from '../db/schema';
import { type UploadImageInput } from '../schema';
import { uploadImage } from '../handlers/upload_image';
import { eq } from 'drizzle-orm';

describe('uploadImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user directly in the database
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  const testInput: UploadImageInput = {
    user_id: 0, // Will be set dynamically
    original_filename: 'test-image.jpg',
    file_path: '/uploads/test-image.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg'
  };

  it('should upload an image', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await uploadImage(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.original_filename).toEqual('test-image.jpg');
    expect(result.file_path).toEqual('/uploads/test-image.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.upload_status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save image upload to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await uploadImage(input);

    const uploads = await db.select()
      .from(imageUploadsTable)
      .where(eq(imageUploadsTable.id, result.id))
      .execute();

    expect(uploads).toHaveLength(1);
    expect(uploads[0].user_id).toEqual(testUserId);
    expect(uploads[0].original_filename).toEqual('test-image.jpg');
    expect(uploads[0].file_path).toEqual('/uploads/test-image.jpg');
    expect(uploads[0].file_size).toEqual(1024000);
    expect(uploads[0].mime_type).toEqual('image/jpeg');
    expect(uploads[0].upload_status).toEqual('pending');
    expect(uploads[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input = { ...testInput, user_id: 999999 };

    await expect(uploadImage(input)).rejects.toThrow(/User with id 999999 not found/i);
  });

  it('should handle PNG mime type', async () => {
    const input = { 
      ...testInput, 
      user_id: testUserId,
      original_filename: 'test-image.png',
      file_path: '/uploads/test-image.png',
      mime_type: 'image/png' as const
    };
    
    const result = await uploadImage(input);

    expect(result.mime_type).toEqual('image/png');
    expect(result.original_filename).toEqual('test-image.png');
  });
});
