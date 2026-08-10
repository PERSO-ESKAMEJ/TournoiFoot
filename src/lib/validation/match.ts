import { z } from 'zod';

export const matchResultSchema = z
  .object({
    team1Score: z.coerce.number().int().min(0).max(50),
    team2Score: z.coerce.number().int().min(0).max(50),
    team1Penalties: z.coerce.number().int().min(0).max(30).optional(),
    team2Penalties: z.coerce.number().int().min(0).max(30).optional(),
  })
  .refine((v) => v.team1Score !== v.team2Score || (v.team1Penalties != null && v.team2Penalties != null), {
    message: 'Match nul : renseigne les tirs au but pour désigner un vainqueur',
    path: ['team1Penalties'],
  })
  .refine(
    (v) => v.team1Score !== v.team2Score || v.team1Penalties !== v.team2Penalties,
    { message: 'Les tirs au but ne peuvent pas être à égalité', path: ['team2Penalties'] }
  );

export type MatchResultInput = z.infer<typeof matchResultSchema>;
