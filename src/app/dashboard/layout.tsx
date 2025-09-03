import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';

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

  return <>{children}</>;
}


