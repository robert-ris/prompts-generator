import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {DashboardNav} from '@/components/shared/DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: {session},
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login?redirectTo=/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}


