
import { db } from '../db';
import { generationJobsTable, usersTable, imageUploadsTable, styleOptionsTable } from '../db/schema';
import { type CreateGenerationJobInput, type GenerationJob } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createGenerationJob = async (input: CreateGenerationJobInput): Promise<GenerationJob> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify image upload exists and belongs to user
    const imageUpload = await db.select()
      .from(imageUploadsTable)
      .where(eq(imageUploadsTable.id, input.image_upload_id))
      .limit(1)
      .execute();

    if (imageUpload.length === 0) {
      throw new Error(`Image upload with id ${input.image_upload_id} not found`);
    }

    if (imageUpload[0].user_id !== input.user_id) {
      throw new Error(`Image upload ${input.image_upload_id} does not belong to user ${input.user_id}`);
    }

    // Verify all style options exist
    const styleOptions = await db.select()
      .from(styleOptionsTable)
      .where(inArray(styleOptionsTable.id, input.style_option_ids))
      .execute();

    if (styleOptions.length !== input.style_option_ids.length) {
      const foundIds = styleOptions.map(style => style.id);
      const missingIds = input.style_option_ids.filter(id => !foundIds.includes(id));
      throw new Error(`Style options not found: ${missingIds.join(', ')}`);
    }

    // Create generation job
    const result = await db.insert(generationJobsTable)
      .values({
        user_id: input.user_id,
        image_upload_id: input.image_upload_id,
        style_option_ids: input.style_option_ids
      })
      .returning()
      .execute();

    const job = result[0];
    return {
      ...job,
      style_option_ids: Array.isArray(job.style_option_ids) 
        ? job.style_option_ids as number[]
        : [job.style_option_ids as number]
    };
  } catch (error) {
    console.error('Generation job creation failed:', error);
    throw error;
  }
};
