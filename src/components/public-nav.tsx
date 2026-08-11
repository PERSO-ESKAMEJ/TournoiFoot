import Link from 'next/link';
import { Trophy, ShieldUser } from 'lucide-react';

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/equipes', label: 'Équipes' },
  { href: '/tournoi', label: 'Tournoi' },
  { href: '/tournoi/tableau', label: 'Tableau' },
  { href: '/infos', label: 'Infos' },
];

export function PublicNav() {
  return (
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 overflow-x-auto px-4 py-3 text-sm">
        <Link href="/" className="group flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <Trophy className="size-4 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span>Accueil tournoi</span>
        </Link>
        <div className="flex shrink-0 items-center gap-5">
          {LINKS.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-[linear-gradient(to_right,var(--gold-gradient-from),var(--gold-gradient-to))] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <Link
            href="/admin/login"
            className="flex items-center gap-1.5 py-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <ShieldUser className="size-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </nav>
      <div className="gold-hairline" />
    </header>
  );
}
