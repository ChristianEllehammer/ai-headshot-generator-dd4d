
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  imageUploadsTable, 
  styleOptionsTable,
  generationJobsTable,
  generatedHeadshotsTable 
} from '../db/schema';
import { getUserSelectedHeadshots } from '../handlers/get_user_selected_headshots';

describe('getUserSelectedHeadshots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return selected headshots for user', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create image upload
    const imageUpload = await db.insert(imageUploadsTable)
      .values({
        user_id: user[0].id,
        original_filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();

    // Create style option
    const styleOption = await db.insert(styleOptionsTable)
      .values({
        name: 'Professional',
        description: 'Professional headshot style',
        background_type: 'solid_color',
        background_config: '{"color": "#ffffff"}',
        is_active: true
      })
      .returning()
      .execute();

    // Create generation job
    const generationJob = await db.insert(generationJobsTable)
      .values({
        user_id: user[0].id,
        image_upload_id: imageUpload[0].id,
        style_option_ids: [styleOption[0].id],
        status: 'completed'
      })
      .returning()
      .execute();

    // Create selected headshot
    const selectedHeadshot = await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: generationJob[0].id,
        style_option_id: styleOption[0].id,
        file_path: '/headshots/selected.jpg',
        file_size: 2048,
        generation_status: 'completed',
        quality_score: 85,
        is_selected: true
      })
      .returning()
      .execute();

    // Create non-selected headshot
    await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: generationJob[0].id,
        style_option_id: styleOption[0].id,
        file_path: '/headshots/not_selected.jpg',
        file_size: 1500,
        generation_status: 'completed',
        quality_score: 75,
        is_selected: false
      })
      .execute();

    const result = await getUserSelectedHeadshots(user[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(selectedHeadshot[0].id);
    expect(result[0].file_path).toEqual('/headshots/selected.jpg');
    expect(result[0].file_size).toEqual(2048);
    expect(result[0].quality_score).toEqual(85);
    expect(result[0].is_selected).toEqual(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no selected headshots', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const result = await getUserSelectedHeadshots(user[0].id);

    expect(result).toHaveLength(0);
  });

  it('should only return headshots for the specified user', async () => {
    // Create two test users
    const user1 = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User One'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two'
      })
      .returning()
      .execute();

    // Create image uploads for both users
    const imageUpload1 = await db.insert(imageUploadsTable)
      .values({
        user_id: user1[0].id,
        original_filename: 'test1.jpg',
        file_path: '/uploads/test1.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();

    const imageUpload2 = await db.insert(imageUploadsTable)
      .values({
        user_id: user2[0].id,
        original_filename: 'test2.jpg',
        file_path: '/uploads/test2.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();

    // Create style option
    const styleOption = await db.insert(styleOptionsTable)
      .values({
        name: 'Professional',
        description: 'Professional headshot style',
        background_type: 'solid_color',
        background_config: '{"color": "#ffffff"}',
        is_active: true
      })
      .returning()
      .execute();

    // Create generation jobs for both users
    const generationJob1 = await db.insert(generationJobsTable)
      .values({
        user_id: user1[0].id,
        image_upload_id: imageUpload1[0].id,
        style_option_ids: [styleOption[0].id],
        status: 'completed'
      })
      .returning()
      .execute();

    const generationJob2 = await db.insert(generationJobsTable)
      .values({
        user_id: user2[0].id,
        image_upload_id: imageUpload2[0].id,
        style_option_ids: [styleOption[0].id],
        status: 'completed'
      })
      .returning()
      .execute();

    // Create selected headshots for both users
    await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: generationJob1[0].id,
        style_option_id: styleOption[0].id,
        file_path: '/headshots/user1_selected.jpg',
        file_size: 2048,
        generation_status: 'completed',
        quality_score: 85,
        is_selected: true
      })
      .execute();

    await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: generationJob2[0].id,
        style_option_id: styleOption[0].id,
        file_path: '/headshots/user2_selected.jpg',
        file_size: 1800,
        generation_status: 'completed',
        quality_score: 90,
        is_selected: true
      })
      .execute();

    const result = await getUserSelectedHeadshots(user1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].file_path).toEqual('/headshots/user1_selected.jpg');
    expect(result[0].quality_score).toEqual(85);
  });
});
