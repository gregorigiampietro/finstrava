import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FinancialEntry, FinancialEntryFormData } from '@/lib/types/financial-entry';
import { useCompany } from '@/lib/contexts/company-context';

export function useFinancialEntries(contractId?: string) {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchFinancialEntries = useCallback(async () => {
    if (!selectedCompanyId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let query = supabase
        .from('financial_entries')
        .select(`
          *,
          customer:customers(id, name, email),
          supplier:suppliers(id, name, email),
          category:categories(id, name, type),
          payment_method:payment_methods(id, name),
          contract:contracts(id, title, contract_number),
          bank_account:bank_accounts(id, name, bank_name)
        `)
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null);

      // Se contractId for fornecido, filtrar por contrato
      if (contractId) {
        query = query.eq('contract_id', contractId);
      }

      query = query.order('due_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      setEntries(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, contractId, supabase]);

  useEffect(() => {
    fetchFinancialEntries();
  }, [fetchFinancialEntries]);

  const createEntry = async (data: FinancialEntryFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const { error } = await supabase
      .from('financial_entries')
      .insert([{ ...data, company_id: selectedCompanyId }]);

    if (error) throw error;
    await fetchFinancialEntries();
  };

  const updateEntry = async (id: string, data: Partial<FinancialEntryFormData>) => {
    const { error } = await supabase
      .from('financial_entries')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    await fetchFinancialEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('financial_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchFinancialEntries();
  };

  const markAsPaid = async (id: string, paymentDate?: string, paymentAmount?: number) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) throw new Error('Lançamento não encontrado');

    const updateData: any = {
      status: 'paid',
      payment_date: paymentDate || new Date().toISOString().split('T')[0],
      payment_amount: paymentAmount || entry.amount,
    };

    const { error } = await supabase
      .from('financial_entries')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await fetchFinancialEntries();
  };

  const markAsPending = async (id: string) => {
    const { error } = await supabase
      .from('financial_entries')
      .update({ 
        status: 'pending',
        payment_date: null,
        payment_amount: null
      })
      .eq('id', id);

    if (error) throw error;
    await fetchFinancialEntries();
  };

  const cancelEntry = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('financial_entries')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    await fetchFinancialEntries();
  };

  const getEntryStats = () => {
    const stats = {
      total: entries.length,
      totalAmount: 0,
      pending: 0,
      pendingAmount: 0,
      paid: 0,
      paidAmount: 0,
      overdue: 0,
      overdueAmount: 0,
      cancelled: 0,
      cancelledAmount: 0,
    };

    entries.forEach(entry => {
      stats.totalAmount += entry.amount;
      
      switch (entry.status) {
        case 'pending':
          stats.pending++;
          stats.pendingAmount += entry.amount;
          break;
        case 'paid':
          stats.paid++;
          stats.paidAmount += entry.payment_amount || entry.amount;
          break;
        case 'overdue':
          stats.overdue++;
          stats.overdueAmount += entry.amount;
          break;
        case 'cancelled':
          stats.cancelled++;
          stats.cancelledAmount += entry.amount;
          break;
      }
    });

    return stats;
  };

  return {
    entries,
    isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    markAsPaid,
    markAsPending,
    cancelEntry,
    getEntryStats,
    refetch: fetchFinancialEntries,
  };
}