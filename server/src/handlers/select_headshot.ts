
import { db } from '../db';
import { generatedHeadshotsTable, generationJobsTable } from '../db/schema';
import { type SelectHeadshotInput, type GeneratedHeadshot } from '../schema';
import { eq, and } from 'drizzle-orm';

export const selectHeadshot = async (input: SelectHeadshotInput): Promise<GeneratedHeadshot> => {
  try {
    // First, verify the headshot exists and belongs to the user
    const headshots = await db.select()
      .from(generatedHeadshotsTable)
      .innerJoin(generationJobsTable, eq(generatedHeadshotsTable.generation_job_id, generationJobsTable.id))
      .where(
        and(
          eq(generatedHeadshotsTable.id, input.headshot_id),
          eq(generationJobsTable.user_id, input.user_id)
        )
      )
      .execute();

    if (headshots.length === 0) {
      throw new Error('Headshot not found or does not belong to user');
    }

    // First, unselect all headshots for this generation job
    const generationJobId = headshots[0].generated_headshots.generation_job_id;
    await db.update(generatedHeadshotsTable)
      .set({ is_selected: false })
      .where(eq(generatedHeadshotsTable.generation_job_id, generationJobId))
      .execute();

    // Then select the specified headshot
    const result = await db.update(generatedHeadshotsTable)
      .set({ is_selected: true })
      .where(eq(generatedHeadshotsTable.id, input.headshot_id))
      .returning()
      .execute();

    const headshot = result[0];
    return {
      ...headshot,
      quality_score: headshot.quality_score
    };
  } catch (error) {
    console.error('Headshot selection failed:', error);
    throw error;
  }
};
