import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/equipes', label: 'Équipes' },
  { href: '/tournoi', label: 'Tournoi' },
  { href: '/tournoi/tableau', label: 'Tableau' },
  { href: '/infos', label: 'Infos' },
];

export function PublicNav() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 overflow-x-auto px-4 py-3 text-sm">
        <Link href="/" className="shrink-0 font-semibold">
          Tournoi commémoratif
        </Link>
        <div className="flex shrink-0 items-center gap-4">
          {LINKS.slice(1).map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
