import { useState, useEffect } from 'react';
import { usePersistedState } from './use-persisted-state';
import { TransactionFilters } from '@/lib/types/transaction';
import { useCompany } from '@/lib/contexts/company-context';
import { createClient } from '@/lib/supabase/client';

export function useTransactionFilters() {
  const { selectedCompany } = useCompany();
  const supabase = createClient();
  
  // Criar uma chave única baseada no usuário e empresa
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase]);
  
  const storageKey = `transaction-filters-${userId}-${selectedCompany?.id || 'default'}`;
  
  const [filters, setFilters] = usePersistedState<TransactionFilters>(
    storageKey,
    {},
    {
      // Customizar serialização para lidar com datas
      serialize: (value) => {
        return JSON.stringify(value);
      },
      deserialize: (value) => {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      }
    }
  );

  // Limpar filtros quando mudar de empresa
  useEffect(() => {
    if (selectedCompany?.id) {
      // Verificar se mudou de empresa comparando com o último ID salvo
      const lastCompanyKey = `last-company-${userId}`;
      const lastCompanyId = localStorage.getItem(lastCompanyKey);
      
      if (lastCompanyId && lastCompanyId !== selectedCompany.id) {
        // Mudou de empresa, limpar filtros
        setFilters({});
      }
      
      // Salvar o ID da empresa atual
      localStorage.setItem(lastCompanyKey, selectedCompany.id);
    }
  }, [selectedCompany?.id, userId, setFilters]);

  return [filters, setFilters] as const;
}