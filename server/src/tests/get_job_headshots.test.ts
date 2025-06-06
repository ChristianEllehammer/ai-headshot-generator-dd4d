
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imageUploadsTable, styleOptionsTable, generationJobsTable, generatedHeadshotsTable } from '../db/schema';
import { getJobHeadshots } from '../handlers/get_job_headshots';

describe('getJobHeadshots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return headshots for a job', async () => {
    // Create user
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
        description: 'Professional style',
        background_type: 'solid_color',
        background_config: '{"color": "#ffffff"}',
        is_active: true
      })
      .returning()
      .execute();

    // Create generation job
    const job = await db.insert(generationJobsTable)
      .values({
        user_id: user[0].id,
        image_upload_id: imageUpload[0].id,
        style_option_ids: [styleOption[0].id],
        status: 'completed'
      })
      .returning()
      .execute();

    // Create generated headshots
    const headshot1 = await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: job[0].id,
        style_option_id: styleOption[0].id,
        file_path: '/generated/headshot1.jpg',
        file_size: 2048,
        generation_status: 'completed',
        quality_score: 85,
        is_selected: false
      })
      .returning()
      .execute();

    const headshot2 = await db.insert(generatedHeadshotsTable)
      .values({
        generation_job_id: job[0].id,
        style_option_id: styleOption[0].id,
        file_path: '/generated/headshot2.jpg',
        file_size: 1896,
        generation_status: 'completed',
        quality_score: null,
        is_selected: true
      })
      .returning()
      .execute();

    const result = await getJobHeadshots(job[0].id);

    expect(result).toHaveLength(2);
    
    // First headshot
    expect(result[0].id).toEqual(headshot1[0].id);
    expect(result[0].generation_job_id).toEqual(job[0].id);
    expect(result[0].style_option_id).toEqual(styleOption[0].id);
    expect(result[0].file_path).toEqual('/generated/headshot1.jpg');
    expect(result[0].file_size).toEqual(2048);
    expect(result[0].generation_status).toEqual('completed');
    expect(result[0].quality_score).toEqual(85);
    expect(result[0].is_selected).toEqual(false);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Second headshot
    expect(result[1].id).toEqual(headshot2[0].id);
    expect(result[1].generation_job_id).toEqual(job[0].id);
    expect(result[1].style_option_id).toEqual(styleOption[0].id);
    expect(result[1].file_path).toEqual('/generated/headshot2.jpg');
    expect(result[1].file_size).toEqual(1896);
    expect(result[1].generation_status).toEqual('completed');
    expect(result[1].quality_score).toBeNull();
    expect(result[1].is_selected).toEqual(true);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for job with no headshots', async () => {
    // Create user
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

    // Create generation job without headshots
    const job = await db.insert(generationJobsTable)
      .values({
        user_id: user[0].id,
        image_upload_id: imageUpload[0].id,
        style_option_ids: [1],
        status: 'pending'
      })
      .returning()
      .execute();

    const result = await getJobHeadshots(job[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent job', async () => {
    const result = await getJobHeadshots(999);

    expect(result).toHaveLength(0);
  });
});
