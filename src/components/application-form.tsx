'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildApplicationSchema, type ApplicationInput } from '@/lib/validation/application';
import { submitApplication, updateApplicationByToken } from '@/lib/actions/applications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2, Plus, Copy } from 'lucide-react';

interface ApplicationFormProps {
  tournamentId: string;
  minPlayers: number;
  maxPlayers: number;
  defaultValues?: Partial<ApplicationInput>;
  mode?: 'create' | 'edit';
  accessToken?: string;
}

const emptyPlayer = { first_name: '', last_name: '', nickname: '', role: '' };

export function ApplicationForm({
  tournamentId,
  minPlayers,
  maxPlayers,
  defaultValues,
  mode = 'create',
  accessToken,
}: ApplicationFormProps) {
  const schema = buildApplicationSchema(minPlayers, maxPlayers);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reference: string; access_token: string } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      tournament_id: tournamentId,
      team_name: '',
      neighborhood: '',
      primary_color: '',
      secondary_color: '',
      comment: '',
      contact_first_name: '',
      contact_last_name: '',
      contact_whatsapp: '',
      contact_phone: '',
      contact_email: '',
      players: [{ ...emptyPlayer }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'players' });

  async function onSubmit(rawValues: ApplicationInput) {
    // `valueAsNumber` renvoie NaN quand le champ est vide — on le ramène à
    // `undefined` (jersey_number est optionnel) avant validation serveur.
    const values: ApplicationInput = {
      ...rawValues,
      players: rawValues.players.map((p) => ({
        ...p,
        jersey_number: p.jersey_number != null && Number.isNaN(p.jersey_number) ? undefined : p.jersey_number,
      })),
    };
    setSubmitting(true);
    try {
      if (mode === 'edit' && accessToken) {
        const res = await updateApplicationByToken(accessToken, minPlayers, maxPlayers, values);
        if (!res.success) {
          toast.error(res.error ?? 'Erreur lors de la mise à jour');
          return;
        }
        toast.success('Candidature mise à jour');
        return;
      }

      const res = await submitApplication(minPlayers, maxPlayers, { ...values, tournament_id: tournamentId });
      if (!res.success || !res.data) {
        toast.error(res.error ?? 'Erreur lors de la soumission');
        return;
      }
      setResult(res.data);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/mon-equipe/${result.access_token}` : '';
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candidature envoyée !</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Référence : <span className="font-mono font-medium text-foreground">{result.reference}</span>. Jean-Raymond
            va examiner ta candidature.
          </p>
          <div className="space-y-2">
            <Label>Ton lien de suivi (à conserver)</Label>
            <div className="flex gap-2">
              <Input readOnly value={link} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast.success('Lien copié');
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce lien te permet de suivre et modifier ta candidature tant qu&apos;elle n&apos;est pas validée.
              Enregistre-le (WhatsApp à toi-même, notes...).
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Équipe</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="team_name">Nom de l&apos;équipe</Label>
            <Input id="team_name" {...register('team_name')} />
            {errors.team_name && <p className="text-xs text-destructive">{errors.team_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="neighborhood">Quartier / provenance</Label>
            <Input id="neighborhood" {...register('neighborhood')} />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label htmlFor="primary_color">Couleur principale</Label>
            <Input id="primary_color" placeholder="Ex: Rouge" {...register('primary_color')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="secondary_color">Couleur secondaire</Label>
            <Input id="secondary_color" placeholder="Optionnel" {...register('secondary_color')} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="comment">Commentaire</Label>
            <Textarea id="comment" placeholder="Optionnel" {...register('comment')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsable</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact_first_name">Prénom</Label>
            <Input id="contact_first_name" {...register('contact_first_name')} />
            {errors.contact_first_name && (
              <p className="text-xs text-destructive">{errors.contact_first_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_last_name">Nom</Label>
            <Input id="contact_last_name" {...register('contact_last_name')} />
            {errors.contact_last_name && (
              <p className="text-xs text-destructive">{errors.contact_last_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_whatsapp">Numéro WhatsApp</Label>
            <Input id="contact_whatsapp" {...register('contact_whatsapp')} />
            {errors.contact_whatsapp && (
              <p className="text-xs text-destructive">{errors.contact_whatsapp.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">Téléphone</Label>
            <Input id="contact_phone" {...register('contact_phone')} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="contact_email">Email</Label>
            <Input id="contact_email" type="email" {...register('contact_email')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Joueurs ({fields.length}/{maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.players?.message && <p className="text-xs text-destructive">{errors.players.message}</p>}
          {fields.map((field, index) => (
            <div key={field.id}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
                <div className="space-y-1">
                  <Label className="text-xs">Prénom</Label>
                  <Input {...register(`players.${index}.first_name`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nom</Label>
                  <Input {...register(`players.${index}.last_name`)} />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Surnom</Label>
                  <Input {...register(`players.${index}.nickname`)} />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">N°</Label>
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    {...register(`players.${index}.jersey_number`, { valueAsNumber: true })}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    aria-label="Supprimer ce joueur"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= maxPlayers}
            onClick={() => append({ ...emptyPlayer })}
          >
            <Plus className="size-4" /> Ajouter un joueur
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Envoi…' : mode === 'edit' ? 'Enregistrer les modifications' : 'Envoyer la candidature'}
      </Button>
    </form>
  );
}
