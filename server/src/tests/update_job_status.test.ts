
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imageUploadsTable, generationJobsTable } from '../db/schema';
import { type UpdateGenerationJobStatusInput } from '../schema';
import { updateJobStatus } from '../handlers/update_job_status';
import { eq } from 'drizzle-orm';

describe('updateJobStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testImageUploadId: number;
  let testJobId: number;

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

    // Create test generation job
    const jobResult = await db.insert(generationJobsTable)
      .values({
        user_id: testUserId,
        image_upload_id: testImageUploadId,
        style_option_ids: [1, 2, 3],
        status: 'pending'
      })
      .returning()
      .execute();
    testJobId = jobResult[0].id;
  });

  it('should update job status to processing', async () => {
    const input: UpdateGenerationJobStatusInput = {
      job_id: testJobId,
      status: 'processing'
    };

    const result = await updateJobStatus(input);

    expect(result.id).toEqual(testJobId);
    expect(result.status).toEqual('processing');
    expect(result.error_message).toBeNull();
    expect(result.completed_at).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.image_upload_id).toEqual(testImageUploadId);
    expect(result.style_option_ids).toEqual([1, 2, 3]);
  });

  it('should update job status to completed with completion timestamp', async () => {
    const input: UpdateGenerationJobStatusInput = {
      job_id: testJobId,
      status: 'completed'
    };

    const result = await updateJobStatus(input);

    expect(result.status).toEqual('completed');
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.error_message).toBeNull();
  });

  it('should update job status to failed with error message and completion timestamp', async () => {
    const input: UpdateGenerationJobStatusInput = {
      job_id: testJobId,
      status: 'failed',
      error_message: 'Processing failed due to invalid image format'
    };

    const result = await updateJobStatus(input);

    expect(result.status).toEqual('failed');
    expect(result.error_message).toEqual('Processing failed due to invalid image format');
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should clear error message when updating to processing after failure', async () => {
    // First set job to failed with error message
    await updateJobStatus({
      job_id: testJobId,
      status: 'failed',
      error_message: 'Initial failure'
    });

    // Then update to processing with null error message
    const input: UpdateGenerationJobStatusInput = {
      job_id: testJobId,
      status: 'processing',
      error_message: null
    };

    const result = await updateJobStatus(input);

    expect(result.status).toEqual('processing');
    expect(result.error_message).toBeNull();
    expect(result.completed_at).toBeNull();
  });

  it('should save status update to database', async () => {
    const input: UpdateGenerationJobStatusInput = {
      job_id: testJobId,
      status: 'completed'
    };

    await updateJobStatus(input);

    // Verify in database
    const jobs = await db.select()
      .from(generationJobsTable)
      .where(eq(generationJobsTable.id, testJobId))
      .execute();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toEqual('completed');
    expect(jobs[0].completed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent job', async () => {
    const input: UpdateGenerationJobStatusInput = {
      job_id: 99999,
      status: 'completed'
    };

    expect(updateJobStatus(input)).rejects.toThrow(/not found/i);
  });
});
