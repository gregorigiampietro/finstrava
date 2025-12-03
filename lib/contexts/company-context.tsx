'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  legal_name: string | null;
  logo_url: string | null;
};

type CompanyContextType = {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  selectCompany: (companyId: string) => void;
  refreshCompanies: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchCompanies = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        router.push('/login');
        return;
      }

      // Garantir que o usuário existe em public.users
      await supabase.rpc('ensure_user_exists');

      // Primeiro, vamos buscar as associações
      const { data: userCompanies, error } = await supabase
        .from('user_companies')
        .select('*, companies(*)')
        .eq('user_id', user.user.id)
        .eq('is_active', true);

      console.log('User companies query result:', { userCompanies, error });

      if (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
        return;
      }

      const companiesList = userCompanies
        ?.map(uc => uc.companies)
        .filter((company): company is Company => company !== null) || [];

      console.log('Companies found:', companiesList);
      setCompanies(companiesList);

      // Se não houver empresa selecionada, seleciona a primeira
      if (!selectedCompany && companiesList.length > 0) {
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        const savedCompany = companiesList.find(c => c.id === savedCompanyId);
        setSelectedCompany(savedCompany || companiesList[0]);
      }
    } catch (error) {
      console.error('Error in fetchCompanies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompanyId', selectedCompany.id);
    }
  }, [selectedCompany]);

  const selectCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
    }
  };

  const refreshCompanies = async () => {
    setIsLoading(true);
    await fetchCompanies();
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        isLoading,
        selectCompany,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}