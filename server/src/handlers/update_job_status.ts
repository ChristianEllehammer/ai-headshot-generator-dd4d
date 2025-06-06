
import { db } from '../db';
import { generationJobsTable } from '../db/schema';
import { type UpdateGenerationJobStatusInput, type GenerationJob } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJobStatus = async (input: UpdateGenerationJobStatusInput): Promise<GenerationJob> => {
  try {
    // Build update values
    const updateValues: any = {
      status: input.status
    };

    // Add error message if provided
    if (input.error_message !== undefined) {
      updateValues.error_message = input.error_message;
    }

    // Set completed_at timestamp when status is completed or failed
    if (input.status === 'completed' || input.status === 'failed') {
      updateValues.completed_at = new Date();
    } else {
      // Clear completed_at for pending/processing status
      updateValues.completed_at = null;
    }

    // Update the job status
    const result = await db.update(generationJobsTable)
      .set(updateValues)
      .where(eq(generationJobsTable.id, input.job_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Generation job with id ${input.job_id} not found`);
    }

    const job = result[0];
    return {
      ...job,
      style_option_ids: job.style_option_ids as number[] // Cast JSONB to number array
    };
  } catch (error) {
    console.error('Job status update failed:', error);
    throw error;
  }
};
