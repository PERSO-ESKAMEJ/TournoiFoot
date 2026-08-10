'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toggleCheckedIn } from '@/lib/actions/bracket';
import type { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];

export function CheckInBoard({ teams }: { teams: Team[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const presentCount = teams.filter((t) => t.checked_in).length;

  function toggle(id: string, next: boolean) {
    setBusyId(id);
    startTransition(async () => {
      await toggleCheckedIn(id, next);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">
        {presentCount} / {teams.length} équipes présentes
      </p>
      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between rounded-lg border p-4">
            <span className="text-lg font-medium">{team.name}</span>
            <Button
              size="lg"
              variant={team.checked_in ? 'default' : 'outline'}
              disabled={pending && busyId === team.id}
              onClick={() => toggle(team.id, !team.checked_in)}
            >
              {team.checked_in ? '✓ Présente' : 'Absente'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
