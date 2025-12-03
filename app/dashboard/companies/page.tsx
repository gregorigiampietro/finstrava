import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CompanyList } from './company-list';

export default async function CompaniesPage() {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6">
      <CompanyList />
    </div>
  );
}