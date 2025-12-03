'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { useCompany } from '@/lib/contexts/company-context';

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  legal_name: string | null;
  created_at: string;
  role: string;
};

export function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { refreshCompanies } = useCompany();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: userCompanies, error } = await supabase
        .from('user_companies')
        .select(`
          role,
          company:companies (
            id,
            name,
            cnpj,
            legal_name,
            created_at
          )
        `)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }

      const companiesList = (userCompanies?.map(uc => {
        // company pode ser um array, então pegamos o primeiro elemento
        const companyData = Array.isArray(uc.company) ? uc.company[0] : uc.company;
        if (!companyData) return null;
        return {
          ...companyData,
          role: uc.role
        } as Company;
      }).filter((company): company is Company => company !== null) || []) as Company[];

      setCompanies(companiesList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja remover esta empresa?')) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('user_companies')
        .update({ is_active: false })
        .eq('company_id', companyId)
        .eq('user_id', user.user.id);

      if (error) {
        console.error('Error deleting company:', error);
        return;
      }

      await fetchCompanies();
      await refreshCompanies();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="text-center">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Minhas Empresas</h1>
        <Button onClick={() => router.push('/dashboard/companies/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma empresa cadastrada</h3>
          <p className="text-gray-500 mb-4">
            Comece criando sua primeira empresa
          </p>
          <Button onClick={() => router.push('/dashboard/companies/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Empresa
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{company.name}</h3>
                  {company.legal_name && (
                    <p className="text-sm text-gray-600 mb-1">{company.legal_name}</p>
                  )}
                  {company.cnpj && (
                    <p className="text-sm text-gray-500">CNPJ: {company.cnpj}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Função: {company.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/companies/${company.id}/edit`)}
                  className="flex-1"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                {company.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(company.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}