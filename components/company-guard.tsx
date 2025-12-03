'use client';

import { useCompany } from '@/lib/contexts/company-context';
import { Loader2 } from 'lucide-react';
import { CreateCompanyModal } from './create-company-modal';

export function CompanyGuard({ children }: { children: React.ReactNode }) {
  const { companies, isLoading } = useCompany();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {children}
      <CreateCompanyModal 
        open={companies.length === 0} 
        onOpenChange={() => {
          // Modal não pode ser fechado se não houver empresas
          if (companies.length === 0) {
            return;
          }
        }}
      />
    </>
  );
}