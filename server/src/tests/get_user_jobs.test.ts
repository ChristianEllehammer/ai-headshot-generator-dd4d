
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imageUploadsTable, generationJobsTable } from '../db/schema';
import { type GetUserJobsInput } from '../schema';
import { getUserJobs } from '../handlers/get_user_jobs';

describe('getUserJobs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get user generation jobs', async () => {
    // Create user directly
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create image upload directly
    const imageResult = await db.insert(imageUploadsTable)
      .values({
        user_id: user.id,
        original_filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    const imageUpload = imageResult[0];

    // Create generation job directly
    const jobResult = await db.insert(generationJobsTable)
      .values({
        user_id: user.id,
        image_upload_id: imageUpload.id,
        style_option_ids: [1, 2, 3],
        status: 'pending'
      })
      .returning()
      .execute();
    const job = jobResult[0];

    const input: GetUserJobsInput = {
      user_id: user.id
    };

    const results = await getUserJobs(input);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(job.id);
    expect(results[0].user_id).toEqual(user.id);
    expect(results[0].image_upload_id).toEqual(imageUpload.id);
    expect(results[0].style_option_ids).toEqual([1, 2, 3]);
    expect(results[0].status).toEqual('pending');
    expect(results[0].error_message).toBeNull();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].completed_at).toBeNull();
  });

  it('should return empty array for user with no jobs', async () => {
    // Create user directly
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const input: GetUserJobsInput = {
      user_id: user.id
    };

    const results = await getUserJobs(input);

    expect(results).toHaveLength(0);
  });

  it('should apply limit and offset correctly', async () => {
    // Create user directly
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create image upload directly
    const imageResult = await db.insert(imageUploadsTable)
      .values({
        user_id: user.id,
        original_filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    const imageUpload = imageResult[0];

    // Create multiple generation jobs directly
    await db.insert(generationJobsTable)
      .values([
        {
          user_id: user.id,
          image_upload_id: imageUpload.id,
          style_option_ids: [1, 2, 3],
          status: 'pending'
        },
        {
          user_id: user.id,
          image_upload_id: imageUpload.id,
          style_option_ids: [4, 5, 6],
          status: 'pending'
        },
        {
          user_id: user.id,
          image_upload_id: imageUpload.id,
          style_option_ids: [7, 8, 9],
          status: 'pending'
        }
      ])
      .execute();

    // Test limit
    const limitedResults = await getUserJobs({
      user_id: user.id,
      limit: 2
    });

    expect(limitedResults).toHaveLength(2);

    // Test offset
    const offsetResults = await getUserJobs({
      user_id: user.id,
      limit: 2,
      offset: 1
    });

    expect(offsetResults).toHaveLength(2);
    expect(offsetResults[0].id).not.toEqual(limitedResults[0].id);
  });

  it('should order jobs by created_at descending', async () => {
    // Create user directly
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create image upload directly
    const imageResult = await db.insert(imageUploadsTable)
      .values({
        user_id: user.id,
        original_filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    const imageUpload = imageResult[0];

    // Create first job
    const job1Result = await db.insert(generationJobsTable)
      .values({
        user_id: user.id,
        image_upload_id: imageUpload.id,
        style_option_ids: [1, 2, 3],
        status: 'pending'
      })
      .returning()
      .execute();
    const job1 = job1Result[0];

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second job
    const job2Result = await db.insert(generationJobsTable)
      .values({
        user_id: user.id,
        image_upload_id: imageUpload.id,
        style_option_ids: [4, 5, 6],
        status: 'pending'
      })
      .returning()
      .execute();
    const job2 = job2Result[0];

    const results = await getUserJobs({
      user_id: user.id
    });

    expect(results).toHaveLength(2);
    // Most recent job should be first
    expect(results[0].id).toEqual(job2.id);
    expect(results[1].id).toEqual(job1.id);
    expect(results[0].created_at >= results[1].created_at).toBe(true);
  });

  it('should only return jobs for specified user', async () => {
    // Create two different users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1 = user1Result[0];

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    // Create image uploads for both users
    const imageUpload1Result = await db.insert(imageUploadsTable)
      .values({
        user_id: user1.id,
        original_filename: 'test1.jpg',
        file_path: '/uploads/test1.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    const imageUpload1 = imageUpload1Result[0];

    const imageUpload2Result = await db.insert(imageUploadsTable)
      .values({
        user_id: user2.id,
        original_filename: 'test2.jpg',
        file_path: '/uploads/test2.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        upload_status: 'completed'
      })
      .returning()
      .execute();
    const imageUpload2 = imageUpload2Result[0];

    // Create jobs for both users
    await db.insert(generationJobsTable)
      .values([
        {
          user_id: user1.id,
          image_upload_id: imageUpload1.id,
          style_option_ids: [1, 2, 3],
          status: 'pending'
        },
        {
          user_id: user2.id,
          image_upload_id: imageUpload2.id,
          style_option_ids: [4, 5, 6],
          status: 'pending'
        }
      ])
      .execute();

    // Get jobs for user1
    const user1Jobs = await getUserJobs({
      user_id: user1.id
    });

    expect(user1Jobs).toHaveLength(1);
    expect(user1Jobs[0].user_id).toEqual(user1.id);

    // Get jobs for user2
    const user2Jobs = await getUserJobs({
      user_id: user2.id
    });

    expect(user2Jobs).toHaveLength(1);
    expect(user2Jobs[0].user_id).toEqual(user2.id);
  });
});
