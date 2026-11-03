import { z } from 'zod';
export const employeeAvatarSchema = z.object({ employeeId: z.string().uuid(), imageData: z.string().min(1).max(8 * 1024 * 1024) }).strict();
