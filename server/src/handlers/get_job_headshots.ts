
import { db } from '../db';
import { generatedHeadshotsTable } from '../db/schema';
import { type GeneratedHeadshot } from '../schema';
import { eq } from 'drizzle-orm';

export const getJobHeadshots = async (jobId: number): Promise<GeneratedHeadshot[]> => {
  try {
    const results = await db.select()
      .from(generatedHeadshotsTable)
      .where(eq(generatedHeadshotsTable.generation_job_id, jobId))
      .execute();

    return results.map(headshot => ({
      ...headshot,
      quality_score: headshot.quality_score ? headshot.quality_score : null
    }));
  } catch (error) {
    console.error('Failed to get job headshots:', error);
    throw error;
  }
};
