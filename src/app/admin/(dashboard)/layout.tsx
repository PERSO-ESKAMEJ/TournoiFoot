import { requireSession } from '@/lib/auth/dal';
import { AdminNav } from '@/components/admin-nav';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AdminNav role={session.role} fullName={session.fullName} />
      <div className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</div>
    </div>
  );
}
