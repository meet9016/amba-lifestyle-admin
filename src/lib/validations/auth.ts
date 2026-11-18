import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Admin email address is required')
    .email('Please provide a valid administrative email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long')
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

