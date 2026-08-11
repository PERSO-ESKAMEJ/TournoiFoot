'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/actions/auth';
import type { ProfileRole } from '@/types/database';

const ITEMS: { href: string; label: string; managersOnly?: boolean }[] = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/candidatures', label: 'Candidatures' },
  { href: '/admin/equipes', label: 'Équipes' },
  { href: '/admin/check-in', label: 'Check-in' },
  { href: '/admin/tournoi/tableau', label: 'Tableau du tournoi' },
  { href: '/admin/tournoi/matchs', label: 'Matchs' },
  { href: '/admin/communication', label: 'Communication', managersOnly: true },
  { href: '/admin/parametres', label: 'Paramètres', managersOnly: true },
];

export function AdminNav({ role, fullName }: { role: ProfileRole; fullName: string }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.managersOnly || role !== 'read_only');

  return (
    <aside className="flex w-full shrink-0 flex-col border-b bg-muted/30 md:w-56 md:border-b-0 md:border-r">
      <div className="border-b p-4">
        <p className="text-sm font-medium">{fullName}</p>
        <p className="text-xs text-muted-foreground">
          {role === 'super_admin' ? 'Super admin' : role === 'tournament_manager' ? 'Responsable' : 'Lecture seule'}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-x-auto p-2 md:overflow-visible">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'shrink-0 rounded-md px-3 py-2 text-sm hover:bg-accent',
              pathname === item.href && 'bg-accent font-medium'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={logout} className="border-t p-2">
        <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent">
          Se déconnecter
        </button>
      </form>
    </aside>
  );
}
