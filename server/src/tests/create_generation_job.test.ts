
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imageUploadsTable, styleOptionsTable, generationJobsTable } from '../db/schema';
import { type CreateGenerationJobInput } from '../schema';
import { createGenerationJob } from '../handlers/create_generation_job';
import { eq } from 'drizzle-orm';

describe('createGenerationJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testImageUploadId: number;
  let testStyleOptionIds: number[];

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test image upload
    const imageResult = await db.insert(imageUploadsTable)
      .values({
        user_id: testUserId,
        original_filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    testImageUploadId = imageResult[0].id;

    // Create test style options
    const styleResults = await db.insert(styleOptionsTable)
      .values([
        {
          name: 'Professional',
          description: 'Professional headshot style',
          background_type: 'solid_color',
          background_config: '{"color": "#ffffff"}',
          is_active: true
        },
        {
          name: 'Casual',
          description: 'Casual headshot style',
          background_type: 'blurred_office',
          background_config: '{"blur": 5}',
          is_active: true
        }
      ])
      .returning()
      .execute();
    testStyleOptionIds = styleResults.map(style => style.id);
  });

  const createTestInput = (): CreateGenerationJobInput => ({
    user_id: testUserId,
    image_upload_id: testImageUploadId,
    style_option_ids: testStyleOptionIds
  });

  it('should create a generation job', async () => {
    const input = createTestInput();
    const result = await createGenerationJob(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.image_upload_id).toEqual(testImageUploadId);
    expect(result.style_option_ids).toEqual(testStyleOptionIds);
    expect(result.status).toEqual('pending');
    expect(result.error_message).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should save generation job to database', async () => {
    const input = createTestInput();
    const result = await createGenerationJob(input);

    const jobs = await db.select()
      .from(generationJobsTable)
      .where(eq(generationJobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].user_id).toEqual(testUserId);
    expect(jobs[0].image_upload_id).toEqual(testImageUploadId);
    expect(jobs[0].style_option_ids).toEqual(testStyleOptionIds);
    expect(jobs[0].status).toEqual('pending');
    expect(jobs[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input = createTestInput();
    input.user_id = 99999;

    expect(createGenerationJob(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should throw error for non-existent image upload', async () => {
    const input = createTestInput();
    input.image_upload_id = 99999;

    expect(createGenerationJob(input)).rejects.toThrow(/Image upload with id 99999 not found/i);
  });

  it('should throw error when image upload belongs to different user', async () => {
    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        name: 'Other User'
      })
      .returning()
      .execute();

    // Create image upload for the other user
    const imageResult = await db.insert(imageUploadsTable)
      .values({
        user_id: anotherUserResult[0].id,
        original_filename: 'other.jpg',
        file_path: '/uploads/other.jpg',
        file_size: 2048,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();

    const input = createTestInput();
    input.image_upload_id = imageResult[0].id; // Use other user's image

    expect(createGenerationJob(input)).rejects.toThrow(/does not belong to user/i);
  });

  it('should throw error for non-existent style options', async () => {
    const input = createTestInput();
    input.style_option_ids = [99999, 99998];

    expect(createGenerationJob(input)).rejects.toThrow(/Style options not found: 99999, 99998/i);
  });

  it('should throw error for partially non-existent style options', async () => {
    const input = createTestInput();
    input.style_option_ids = [testStyleOptionIds[0], 99999];

    expect(createGenerationJob(input)).rejects.toThrow(/Style options not found: 99999/i);
  });

  it('should handle single style option', async () => {
    const input = createTestInput();
    input.style_option_ids = [testStyleOptionIds[0]];

    const result = await createGenerationJob(input);

    expect(result.style_option_ids).toEqual([testStyleOptionIds[0]]);
    expect(result.status).toEqual('pending');
  });
});
