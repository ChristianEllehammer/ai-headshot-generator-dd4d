
import { serial, text, pgTable, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const uploadStatusEnum = pgEnum('upload_status', ['pending', 'completed', 'failed']);
export const backgroundTypeEnum = pgEnum('background_type', ['solid_color', 'blurred_office', 'gradient', 'studio']);
export const generationStatusEnum = pgEnum('generation_status', ['pending', 'processing', 'completed', 'failed']);
export const headshotStatusEnum = pgEnum('headshot_status', ['pending', 'completed', 'failed']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Image uploads table
export const imageUploadsTable = pgTable('image_uploads', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  original_filename: text('original_filename').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  upload_status: uploadStatusEnum('upload_status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Style options table
export const styleOptionsTable = pgTable('style_options', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  background_type: backgroundTypeEnum('background_type').notNull(),
  background_config: text('background_config').notNull(), // JSON string
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Generation jobs table
export const generationJobsTable = pgTable('generation_jobs', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  image_upload_id: integer('image_upload_id').notNull().references(() => imageUploadsTable.id),
  style_option_ids: jsonb('style_option_ids').notNull(), // Array of style option IDs
  status: generationStatusEnum('status').default('pending').notNull(),
  error_message: text('error_message'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at')
});

// Generated headshots table
export const generatedHeadshotsTable = pgTable('generated_headshots', {
  id: serial('id').primaryKey(),
  generation_job_id: integer('generation_job_id').notNull().references(() => generationJobsTable.id),
  style_option_id: integer('style_option_id').notNull().references(() => styleOptionsTable.id),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  generation_status: headshotStatusEnum('generation_status').default('pending').notNull(),
  quality_score: integer('quality_score'), // 1-100 quality score
  is_selected: boolean('is_selected').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  imageUploads: many(imageUploadsTable),
  generationJobs: many(generationJobsTable)
}));

export const imageUploadsRelations = relations(imageUploadsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [imageUploadsTable.user_id],
    references: [usersTable.id]
  }),
  generationJobs: many(generationJobsTable)
}));

export const generationJobsRelations = relations(generationJobsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [generationJobsTable.user_id],
    references: [usersTable.id]
  }),
  imageUpload: one(imageUploadsTable, {
    fields: [generationJobsTable.image_upload_id],
    references: [imageUploadsTable.id]
  }),
  generatedHeadshots: many(generatedHeadshotsTable)
}));

export const generatedHeadshotsRelations = relations(generatedHeadshotsTable, ({ one }) => ({
  generationJob: one(generationJobsTable, {
    fields: [generatedHeadshotsTable.generation_job_id],
    references: [generationJobsTable.id]
  }),
  styleOption: one(styleOptionsTable, {
    fields: [generatedHeadshotsTable.style_option_id],
    references: [styleOptionsTable.id]
  })
}));

export const styleOptionsRelations = relations(styleOptionsTable, ({ many }) => ({
  generatedHeadshots: many(generatedHeadshotsTable)
}));

// Export all tables
export const tables = {
  users: usersTable,
  imageUploads: imageUploadsTable,
  styleOptions: styleOptionsTable,
  generationJobs: generationJobsTable,
  generatedHeadshots: generatedHeadshotsTable
};
