'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { tournamentSettingsSchema, type TournamentSettingsInput } from '@/lib/validation/tournament';
import { saveTournamentSettings } from '@/lib/actions/tournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TOURNAMENT_STATUS_LABELS } from '@/lib/format';
import type { Database } from '@/types/database';

type Tournament = Database['public']['Tables']['tournaments']['Row'];

export function TournamentSettingsForm({ tournament }: { tournament: Tournament | null }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TournamentSettingsInput>({
    resolver: zodResolver(tournamentSettingsSchema),
    defaultValues: tournament
      ? {
          name: tournament.name,
          memorial_subtitle: tournament.memorial_subtitle ?? '',
          description: tournament.description ?? '',
          event_date: tournament.event_date,
          start_time: tournament.start_time.slice(0, 5),
          end_time: tournament.end_time.slice(0, 5),
          venue_name: tournament.venue_name,
          venue_city: tournament.venue_city,
          max_teams: tournament.max_teams,
          min_players_per_team: tournament.min_players_per_team,
          max_players_per_team: tournament.max_players_per_team,
          match_duration_minutes: tournament.match_duration_minutes,
          transition_minutes: tournament.transition_minutes,
          status: tournament.status,
          contact_name: tournament.contact_name ?? '',
          contact_phone: tournament.contact_phone ?? '',
          father_name: tournament.father_name ?? '',
        }
      : {
          name: 'Tournoi commémoratif — 20 ans',
          memorial_subtitle: '',
          description: '',
          event_date: '2026-10-30',
          start_time: '13:00',
          end_time: '17:00',
          venue_name: 'Stade de Deido',
          venue_city: 'Douala',
          max_teams: 8,
          min_players_per_team: 5,
          max_players_per_team: 12,
          match_duration_minutes: 20,
          transition_minutes: 5,
          status: 'preparation',
          contact_name: '',
          contact_phone: '',
          father_name: '',
        },
  });

  async function onSubmit(values: TournamentSettingsInput) {
    const res = await saveTournamentSettings(tournament?.id ?? null, values);
    if (!res.success) {
      toast.error(res.error ?? 'Erreur');
      return;
    }
    toast.success('Tournoi enregistré');
    router.refresh();
  }

  const status = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Général</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Nom du tournoi</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Sous-titre commémoratif</Label>
            <Input placeholder="Ex: En mémoire de..." {...register('memorial_subtitle')} />
          </div>
          <div className="space-y-1.5">
            <Label>Nom de la personne honorée</Label>
            <Input {...register('father_name')} />
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setValue('status', v as TournamentSettingsInput['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOURNAMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register('description')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date, lieu, créneau</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" {...register('event_date')} />
          </div>
          <div className="space-y-1.5">
            <Label>Heure de début</Label>
            <Input type="time" {...register('start_time')} />
          </div>
          <div className="space-y-1.5">
            <Label>Heure de fin</Label>
            <Input type="time" {...register('end_time')} />
          </div>
          <div className="space-y-1.5">
            <Label>Lieu</Label>
            <Input {...register('venue_name')} />
          </div>
          <div className="space-y-1.5">
            <Label>Ville</Label>
            <Input {...register('venue_city')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Règles du tournoi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Équipes max</Label>
            <Input type="number" {...register('max_teams', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Joueurs min / équipe</Label>
            <Input type="number" {...register('min_players_per_team', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Joueurs max / équipe</Label>
            <Input type="number" {...register('max_players_per_team', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Durée d&apos;un match (min)</Label>
            <Input type="number" {...register('match_duration_minutes', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Transition entre matchs (min)</Label>
            <Input type="number" {...register('transition_minutes', { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Nom du contact</Label>
            <Input {...register('contact_name')} />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone du contact</Label>
            <Input {...register('contact_phone')} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  );
}
