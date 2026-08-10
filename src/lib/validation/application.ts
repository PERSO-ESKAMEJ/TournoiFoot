import { z } from 'zod';

export const playerSchema = z.object({
  first_name: z.string().trim().min(1, 'Prénom requis').max(60),
  last_name: z.string().trim().min(1, 'Nom requis').max(60),
  nickname: z.string().trim().max(40).optional().or(z.literal('')),
  // number() plutôt que coerce() : évite le décalage de type input/output avec
  // zodResolver, la conversion se fait côté formulaire via `valueAsNumber`.
  jersey_number: z.number().int().min(0).max(99).optional(),
  role: z.string().trim().max(40).optional().or(z.literal('')),
});

export type PlayerInput = z.infer<typeof playerSchema>;

const applicationBaseSchema = z.object({
  tournament_id: z.uuid(),
  team_name: z.string().trim().min(2, "Nom d'équipe requis").max(80),
  neighborhood: z.string().trim().max(80).optional().or(z.literal('')),
  primary_color: z.string().trim().max(40).optional().or(z.literal('')),
  secondary_color: z.string().trim().max(40).optional().or(z.literal('')),
  logo_url: z.url().optional().or(z.literal('')),
  comment: z.string().trim().max(500).optional().or(z.literal('')),
  contact_first_name: z.string().trim().min(1, 'Prénom requis').max(60),
  contact_last_name: z.string().trim().min(1, 'Nom requis').max(60),
  contact_whatsapp: z.string().trim().min(6, 'Numéro WhatsApp requis').max(30),
  contact_phone: z.string().trim().max(30).optional().or(z.literal('')),
  contact_email: z.email().optional().or(z.literal('')),
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
