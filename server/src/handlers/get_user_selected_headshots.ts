
import { db } from '../db';
import { generatedHeadshotsTable, generationJobsTable } from '../db/schema';
import { type GeneratedHeadshot } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getUserSelectedHeadshots = async (userId: number): Promise<GeneratedHeadshot[]> => {
  try {
    const results = await db.select()
      .from(generatedHeadshotsTable)
      .innerJoin(
        generationJobsTable,
        eq(generatedHeadshotsTable.generation_job_id, generationJobsTable.id)
      )
      .where(
        and(
          eq(generationJobsTable.user_id, userId),
          eq(generatedHeadshotsTable.is_selected, true)
        )
      )
      .execute();

    return results.map(result => ({
      ...result.generated_headshots,
      quality_score: result.generated_headshots.quality_score
    }));
  } catch (error) {
    console.error('Failed to get user selected headshots:', error);
    throw error;
  }
};
