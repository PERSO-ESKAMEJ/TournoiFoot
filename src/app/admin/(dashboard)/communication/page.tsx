import { headers } from 'next/headers';
import { getCurrentTournament } from '@/lib/data/tournament';
import { RegistrationQrCode } from '@/components/registration-qr-code';

export default async function CommunicationPage() {
  const tournament = await getCurrentTournament();
  if (!tournament) return <p className="text-sm text-muted-foreground">Aucun tournoi.</p>;

  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const registrationUrl = `${protocol}://${host}/inscription`;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Communication</h1>
      <RegistrationQrCode url={registrationUrl} />
    </div>
  );
}
