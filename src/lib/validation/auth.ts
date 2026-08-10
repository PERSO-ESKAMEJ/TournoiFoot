import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

export type LoginInput = z.infer<typeof loginSchema>;
