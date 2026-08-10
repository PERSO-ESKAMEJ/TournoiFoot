import { z } from 'zod';

export const tournamentSettingsSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis').max(120),
  memorial_subtitle: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  event_date: z.string().min(1, 'Date requise'),
  start_time: z.string().min(1, 'Heure de début requise'),
  end_time: z.string().min(1, 'Heure de fin requise'),
  venue_name: z.string().trim().min(1, 'Lieu requis').max(120),
  venue_city: z.string().trim().min(1, 'Ville requise').max(80),
  // number() plutôt que coerce() : évite le décalage de type input/output avec
  // zodResolver, la conversion se fait côté formulaire via `valueAsNumber`.
  max_teams: z.number().int().min(2).max(64),
  min_players_per_team: z.number().int().min(1).max(30),
  max_players_per_team: z.number().int().min(1).max(30),
  match_duration_minutes: z.number().int().min(5).max(120),
  transition_minutes: z.number().int().min(0).max(60),
  registration_opens_at: z.string().optional().or(z.literal('')),
  registration_closes_at: z.string().optional().or(z.literal('')),
  status: z.enum([
    'preparation',
    'registrations_open',
    'registrations_closed',
    'bracket_ready',
    'in_progress',
    'completed',
  ]),
  contact_name: z.string().trim().max(120).optional().or(z.literal('')),
  contact_phone: z.string().trim().max(30).optional().or(z.literal('')),
  father_name: z.string().trim().max(120).optional().or(z.literal('')),
  field_price_per_hour: z.number().min(0).optional(),
  field_hours_booked: z.number().min(0).optional(),
  jersey_unit_price: z.number().min(0).optional(),
});

export type TournamentSettingsInput = z.infer<typeof tournamentSettingsSchema>;
