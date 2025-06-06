
import { db } from '../db';
import { generationJobsTable } from '../db/schema';
import { type GetUserJobsInput, type GenerationJob } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserJobs = async (input: GetUserJobsInput): Promise<GenerationJob[]> => {
  try {
    // Build the complete query in one go to avoid TypeScript issues
    const baseQuery = db.select()
      .from(generationJobsTable)
      .where(eq(generationJobsTable.user_id, input.user_id))
      .orderBy(desc(generationJobsTable.created_at));

    // Apply pagination based on what's provided
    let results;
    if (input.limit !== undefined && input.offset !== undefined) {
      results = await baseQuery.limit(input.limit).offset(input.offset).execute();
    } else if (input.limit !== undefined) {
      results = await baseQuery.limit(input.limit).execute();
    } else if (input.offset !== undefined) {
      results = await baseQuery.offset(input.offset).execute();
    } else {
      results = await baseQuery.execute();
    }

    // Return results with proper type conversion
    return results.map(job => ({
      ...job,
      style_option_ids: job.style_option_ids as number[] // Cast JSONB to number array
    }));
  } catch (error) {
    console.error('Getting user jobs failed:', error);
    throw error;
  }
};
