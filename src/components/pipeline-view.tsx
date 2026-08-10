import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PipelineStage {
  label: string;
  teamNames: string[];
  highlight?: boolean;
}

/**
 * Vue A du parcours du tournoi : Candidatures → Validées → Présentes →
 * [rounds...] → Vainqueur, chaque étape listant les équipes concernées.
 */
export function PipelineView({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max items-stretch gap-3">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-stretch gap-3">
            <div
              className={cn(
                'w-44 rounded-lg border p-3',
                stage.highlight && 'border-amber-500 bg-amber-500/10'
              )}
            >
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {stage.highlight && <Trophy className="size-3.5 text-amber-500" />}
                {stage.label}
              </div>
              {stage.teamNames.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-1">
                  {stage.teamNames.map((name) => (
                    <li key={name} className="truncate text-sm">
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className="flex items-center text-muted-foreground">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
