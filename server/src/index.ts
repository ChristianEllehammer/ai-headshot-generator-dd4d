
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema,
  uploadImageInputSchema,
  createGenerationJobInputSchema,
  updateGenerationJobStatusInputSchema,
  selectHeadshotInputSchema,
  getUserJobsInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { uploadImage } from './handlers/upload_image';
import { getStyleOptions } from './handlers/get_style_options';
import { createGenerationJob } from './handlers/create_generation_job';
import { getUserJobs } from './handlers/get_user_jobs';
import { getJobHeadshots } from './handlers/get_job_headshots';
import { selectHeadshot } from './handlers/select_headshot';
import { updateJobStatus } from './handlers/update_job_status';
import { getUserSelectedHeadshots } from './handlers/get_user_selected_headshots';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Image upload
  uploadImage: publicProcedure
    .input(uploadImageInputSchema)
    .mutation(({ input }) => uploadImage(input)),

  // Style options
  getStyleOptions: publicProcedure
    .query(() => getStyleOptions()),

  // Generation jobs
  createGenerationJob: publicProcedure
    .input(createGenerationJobInputSchema)
    .mutation(({ input }) => createGenerationJob(input)),

  getUserJobs: publicProcedure
    .input(getUserJobsInputSchema)
    .query(({ input }) => getUserJobs(input)),

  updateJobStatus: publicProcedure
    .input(updateGenerationJobStatusInputSchema)
    .mutation(({ input }) => updateJobStatus(input)),

  // Generated headshots
  getJobHeadshots: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(({ input }) => getJobHeadshots(input.jobId)),

  selectHeadshot: publicProcedure
    .input(selectHeadshotInputSchema)
    .mutation(({ input }) => selectHeadshot(input)),

  getUserSelectedHeadshots: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserSelectedHeadshots(input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
