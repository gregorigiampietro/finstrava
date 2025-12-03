import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { CompanyForm } from '../../company-form';

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Verificar se o usuário tem acesso à empresa
  const { data: userCompany } = await supabase
    .from('user_companies')
    .select(`
      role,
      company:companies (
        id,
        name,
        legal_name,
        cnpj
      )
    `)
    .eq('user_id', user.id)
    .eq('company_id', id)
    .eq('is_active', true)
    .single();

  if (!userCompany || !userCompany.company) {
    notFound();
  }

  // Apenas admins podem editar
  if (userCompany.role !== 'admin') {
    redirect('/dashboard/companies');
  }

  // Garantir que company seja um objeto único
  const company = Array.isArray(userCompany.company)
    ? userCompany.company[0]
    : userCompany.company;

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Editar Empresa</h1>
      <CompanyForm company={company} />
    </div>
  );
}