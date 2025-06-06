
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imageUploadsTable, styleOptionsTable, generationJobsTable, generatedHeadshotsTable } from '../db/schema';
import { type SelectHeadshotInput } from '../schema';
import { selectHeadshot } from '../handlers/select_headshot';
import { eq } from 'drizzle-orm';

describe('selectHeadshot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should select a headshot and unselect others', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create image upload
    const imageResult = await db.insert(imageUploadsTable)
      .values({
        user_id: userId,
        original_filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    // Create style option
    const styleResult = await db.insert(styleOptionsTable)
      .values({
        name: 'Professional',
        description: 'Professional headshot style',
        background_type: 'solid_color',
        background_config: '{"color": "#ffffff"}'
      })
      .returning()
      .execute();
    const styleId = styleResult[0].id;

    // Create generation job
    const jobResult = await db.insert(generationJobsTable)
      .values({
        user_id: userId,
        image_upload_id: imageId,
        style_option_ids: [styleId],
        status: 'completed'
      })
      .returning()
      .execute();
    const jobId = jobResult[0].id;

    // Create multiple headshots for the job
    const headshot1Result = await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: jobId,
        style_option_id: styleId,
        file_path: '/generated/headshot1.jpg',
        file_size: 2048,
        generation_status: 'completed',
        quality_score: 85,
        is_selected: true // Initially selected
      })
      .returning()
      .execute();
    const headshot1Id = headshot1Result[0].id;

    const headshot2Result = await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: jobId,
        style_option_id: styleId,
        file_path: '/generated/headshot2.jpg',
        file_size: 2100,
        generation_status: 'completed',
        quality_score: 90,
        is_selected: false
      })
      .returning()
      .execute();
    const headshot2Id = headshot2Result[0].id;

    const testInput: SelectHeadshotInput = {
      user_id: userId,
      headshot_id: headshot2Id
    };

    // Select the second headshot
    const result = await selectHeadshot(testInput);

    // Verify the returned headshot
    expect(result.id).toEqual(headshot2Id);
    expect(result.is_selected).toEqual(true);
    expect(result.quality_score).toEqual(90);

    // Verify headshot selection in database
    const headshots = await db.select()
      .from(generatedHeadshotsTable)
      .where(eq(generatedHeadshotsTable.generation_job_id, jobId))
      .execute();

    expect(headshots).toHaveLength(2);
    
    const selectedHeadshots = headshots.filter(h => h.is_selected);
    expect(selectedHeadshots).toHaveLength(1);
    expect(selectedHeadshots[0].id).toEqual(headshot2Id);

    const unselectedHeadshots = headshots.filter(h => !h.is_selected);
    expect(unselectedHeadshots).toHaveLength(1);
    expect(unselectedHeadshots[0].id).toEqual(headshot1Id);
  });

  it('should throw error for non-existent headshot', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const testInput: SelectHeadshotInput = {
      user_id: userId,
      headshot_id: 999 // Non-existent ID
    };

    await expect(selectHeadshot(testInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when headshot belongs to different user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create image upload for user1
    const imageResult = await db.insert(imageUploadsTable)
      .values({
        user_id: user1Id,
        original_filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    // Create style option
    const styleResult = await db.insert(styleOptionsTable)
      .values({
        name: 'Professional',
        description: 'Professional headshot style',
        background_type: 'solid_color',
        background_config: '{"color": "#ffffff"}'
      })
      .returning()
      .execute();
    const styleId = styleResult[0].id;

    // Create generation job for user1
    const jobResult = await db.insert(generationJobsTable)
      .values({
        user_id: user1Id,
        image_upload_id: imageId,
        style_option_ids: [styleId],
        status: 'completed'
      })
      .returning()
      .execute();
    const jobId = jobResult[0].id;

    // Create headshot for user1's job
    const headshotResult = await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: jobId,
        style_option_id: styleId,
        file_path: '/generated/headshot.jpg',
        file_size: 2048,
        generation_status: 'completed',
        quality_score: 85,
        is_selected: false
      })
      .returning()
      .execute();
    const headshotId = headshotResult[0].id;

    // Try to select user1's headshot as user2
    const testInput: SelectHeadshotInput = {
      user_id: user2Id,
      headshot_id: headshotId
    };

    await expect(selectHeadshot(testInput)).rejects.toThrow(/not found.*belong/i);
  });
});
