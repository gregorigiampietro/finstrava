import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/lib/contexts/company-context';

interface GeneratedTransaction {
  contract_id: string;
  transaction_id: string;
  customer_name: string;
  contract_title: string;
  amount: number;
}

interface ProcessedRenewal {
  contract_id: string;
  old_end_date: string;
  new_end_date: string;
  customer_name: string;
  contract_title: string;
}

interface ExpiredContract {
  contract_id: string;
  customer_name: string;
  contract_title: string;
  end_date: string;
}

export function useContractAutomation() {
  const { selectedCompany } = useCompany();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const generateTransactions = async (date?: string): Promise<GeneratedTransaction[]> => {
    if (!selectedCompany?.id) throw new Error('Nenhuma empresa selecionada');

    try {
      setIsProcessing(true);
      setError(null);

      const { data, error } = await supabase.rpc('generate_contract_transactions', {
        p_date: date || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const processRenewals = async (date?: string): Promise<ProcessedRenewal[]> => {
    if (!selectedCompany?.id) throw new Error('Nenhuma empresa selecionada');

    try {
      setIsProcessing(true);
      setError(null);

      const { data, error } = await supabase.rpc('process_contract_renewals', {
        p_date: date || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const expireContracts = async (date?: string): Promise<ExpiredContract[]> => {
    if (!selectedCompany?.id) throw new Error('Nenhuma empresa selecionada');

    try {
      setIsProcessing(true);
      setError(null);

      const { data, error } = await supabase.rpc('expire_contracts', {
        p_date: date || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const processAllAutomation = async (date?: string) => {
    const results = {
      generatedTransactions: [] as GeneratedTransaction[],
      processedRenewals: [] as ProcessedRenewal[],
      expiredContracts: [] as ExpiredContract[],
    };

    try {
      setIsProcessing(true);
      setError(null);

      // Processar renovações primeiro
      results.processedRenewals = await processRenewals(date);
      
      // Expirar contratos que não renovam automaticamente
      results.expiredContracts = await expireContracts(date);
      
      // Gerar transações para contratos ativos
      results.generatedTransactions = await generateTransactions(date);

      return results;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const getContractsForDate = async (date: string) => {
    if (!selectedCompany?.id) throw new Error('Nenhuma empresa selecionada');

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customer:customers(id, name, email)
        `)
        .eq('company_id', selectedCompany.id)
        .eq('next_billing_date', date)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const getContractsExpiring = async (daysAhead: number = 30) => {
    if (!selectedCompany?.id) throw new Error('Nenhuma empresa selecionada');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customer:customers(id, name, email)
        `)
        .eq('company_id', selectedCompany.id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .lte('end_date', futureDate.toISOString().split('T')[0]);

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    generateTransactions,
    processRenewals,
    expireContracts,
    processAllAutomation,
    getContractsForDate,
    getContractsExpiring,
    isProcessing,
    error,
  };
}