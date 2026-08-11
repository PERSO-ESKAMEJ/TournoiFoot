import { z } from 'zod';

export const playerSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(80),
});

export type PlayerInput = z.infer<typeof playerSchema>;

const applicationBaseSchema = z.object({
  tournament_id: z.uuid(),
  team_name: z.string().trim().min(2, "Nom d'équipe requis").max(80),
  comment: z.string().trim().max(500).optional().or(z.literal('')),
  contact_name: z.string().trim().min(1, 'Nom du responsable requis').max(120),
  contact_whatsapp: z.string().trim().min(6, 'Numéro WhatsApp requis').max(30),
});

/**
 * Le nombre min/max de joueurs est configurable par tournoi (paramètres) —
 * on construit donc le schéma dynamiquement plutôt que de figer une constante.
 */
export function buildApplicationSchema(minPlayers: number, maxPlayers: number) {
  return applicationBaseSchema.extend({
    players: z
      .array(playerSchema)
      .min(minPlayers, `Au moins ${minPlayers} joueurs requis`)
      .max(maxPlayers, `Maximum ${maxPlayers} joueurs`),
  });
}

export type ApplicationInput = z.infer<ReturnType<typeof buildApplicationSchema>>;
