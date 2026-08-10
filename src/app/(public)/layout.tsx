import { PublicNav } from '@/components/public-nav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PublicNav />
      {children}
    </div>
  );
}
