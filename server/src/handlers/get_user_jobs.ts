
import { type GetUserJobsInput, type GenerationJob } from '../schema';

export declare function getUserJobs(input: GetUserJobsInput): Promise<GenerationJob[]>;
