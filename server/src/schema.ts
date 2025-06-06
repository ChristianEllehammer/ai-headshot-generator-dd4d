
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Image upload schema
export const imageUploadSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  original_filename: z.string(),
  file_path: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  upload_status: z.enum(['pending', 'completed', 'failed']),
  created_at: z.coerce.date()
});

export type ImageUpload = z.infer<typeof imageUploadSchema>;

// Style options schema
export const styleOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  background_type: z.enum(['solid_color', 'blurred_office', 'gradient', 'studio']),
  background_config: z.string(), // JSON string for background configuration
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type StyleOption = z.infer<typeof styleOptionSchema>;

// Generation job schema
export const generationJobSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  image_upload_id: z.number(),
  style_option_ids: z.array(z.number()),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  error_message: z.string().nullable(),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable()
});

export type GenerationJob = z.infer<typeof generationJobSchema>;

// Generated headshot schema
export const generatedHeadshotSchema = z.object({
  id: z.number(),
  generation_job_id: z.number(),
  style_option_id: z.number(),
  file_path: z.string(),
  file_size: z.number().int(),
  generation_status: z.enum(['pending', 'completed', 'failed']),
  quality_score: z.number().nullable(),
  is_selected: z.boolean(),
  created_at: z.coerce.date()
});

export type GeneratedHeadshot = z.infer<typeof generatedHeadshotSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const uploadImageInputSchema = z.object({
  user_id: z.number(),
  original_filename: z.string(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  mime_type: z.enum(['image/jpeg', 'image/png'])
});

export type UploadImageInput = z.infer<typeof uploadImageInputSchema>;

export const createGenerationJobInputSchema = z.object({
  user_id: z.number(),
  image_upload_id: z.number(),
  style_option_ids: z.array(z.number()).min(1).max(10)
});

export type CreateGenerationJobInput = z.infer<typeof createGenerationJobInputSchema>;

export const updateGenerationJobStatusInputSchema = z.object({
  job_id: z.number(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  error_message: z.string().nullable().optional()
});

export type UpdateGenerationJobStatusInput = z.infer<typeof updateGenerationJobStatusInputSchema>;

export const selectHeadshotInputSchema = z.object({
  user_id: z.number(),
  headshot_id: z.number()
});

export type SelectHeadshotInput = z.infer<typeof selectHeadshotInputSchema>;

export const getUserJobsInputSchema = z.object({
  user_id: z.number(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetUserJobsInput = z.infer<typeof getUserJobsInputSchema>;
