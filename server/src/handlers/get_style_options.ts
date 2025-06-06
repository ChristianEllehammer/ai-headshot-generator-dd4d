
import { db } from '../db';
import { styleOptionsTable } from '../db/schema';
import { type StyleOption } from '../schema';
import { eq } from 'drizzle-orm';

export const getStyleOptions = async (): Promise<StyleOption[]> => {
  try {
    // Get all active style options
    const results = await db.select()
      .from(styleOptionsTable)
      .where(eq(styleOptionsTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get style options:', error);
    throw error;
  }
};
