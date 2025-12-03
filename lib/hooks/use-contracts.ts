import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contract, ContractFormData } from '@/lib/types/contract';
import { ContractCancellationData } from '@/lib/types/financial-entry';
import { useCompany } from '@/lib/contexts/company-context';

export function useContracts() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchContracts = useCallback(async () => {
    if (!selectedCompanyId) {
      setContracts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customer:customers(id, name, email),
          category:categories(id, name),
          payment_method:payment_methods(id, name),
          contract_items(
            *,
            product:products(id, name, type, unit)
          )
        `)
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const createContract = async (data: ContractFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    // Calcular próxima data de cobrança usando a nova função
    const nextBillingDate = await calculateFirstNextBillingDate(
      data.start_date,
      data.billing_type,
      data.billing_day
    );

    // Separar contract_items do resto dos dados
    const { contract_items, ...contractData } = data;

    // Filtrar campos undefined do contrato
    const cleanContractData = Object.entries(contractData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const finalContractData = {
      ...cleanContractData,
      company_id: selectedCompanyId,
      next_billing_date: nextBillingDate,
      status: 'active' as const,
      first_billing_processed: false,
      first_billing_date: data.first_billing_date, // Data do primeiro pagamento definida pelo usuário
      created_with_first_billing: true,
      contract_duration_months: data.contract_duration_months || null,
    };

    // Criar o contrato e seus itens em uma transação
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert([finalContractData])
      .select('id')
      .single();

    if (contractError) throw contractError;

    // Criar os itens do contrato se existirem
    if (contract && contract_items && contract_items.length > 0) {
      const contractItemsData = contract_items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        description: item.description,
        contract_id: contract.id,
        is_active: item.is_active ?? true,
      }));

      const { error: itemsError } = await supabase
        .from('contract_items')
        .insert(contractItemsData);

      if (itemsError) throw itemsError;
    }

    await fetchContracts();
  };

  const updateContract = async (id: string, data: Partial<ContractFormData>) => {
    // Se mudou billing_type ou billing_day, recalcular próxima data
    let nextBillingDate;
    if (data.billing_type || data.billing_day) {
      const contract = contracts.find(c => c.id === id);
      if (contract) {
        // Se ainda não processou primeira cobrança, usar calculate_first_next_billing_date
        if (!contract.first_billing_processed) {
          nextBillingDate = await calculateFirstNextBillingDate(
            data.start_date || contract.start_date,
            data.billing_type || contract.billing_type,
            data.billing_day || contract.billing_day
          );
        } else if (contract.next_billing_date) {
          // Se já processou, usar a data atual de cobrança
          nextBillingDate = await calculateNextBillingDate(
            contract.next_billing_date,
            data.billing_type || contract.billing_type,
            data.billing_day || contract.billing_day
          );
        }
      }
    }

    // Filtrar campos undefined
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const updateData = {
      ...cleanData,
      ...(nextBillingDate && { next_billing_date: nextBillingDate }),
    };

    const { error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await fetchContracts();
  };

  const deleteContract = async (id: string) => {
    const { error } = await supabase
      .from('contracts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchContracts();
  };

  const activateContract = async (id: string) => {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) throw error;
    await fetchContracts();
  };

  const pauseContract = async (id: string) => {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'paused' })
      .eq('id', id);

    if (error) throw error;
    await fetchContracts();
  };

  const cancelContract = async (id: string) => {
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;
    await fetchContracts();
  };

  const cancelContractWithFee = async (data: ContractCancellationData) => {
    const { data: result, error } = await supabase
      .rpc('cancel_contract_with_fee', {
        p_contract_id: data.contract_id,
        p_cancellation_reason: data.cancellation_reason,
        p_cancellation_fee: data.cancellation_fee || 0,
        p_cancellation_date: data.cancellation_date || new Date().toISOString().split('T')[0]
      });

    if (error) throw error;
    
    await fetchContracts();
    return result;
  };

  const getContract = async (id: string): Promise<Contract | null> => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        customer:customers(id, name, email),
        category:categories(id, name),
        payment_method:payment_methods(id, name),
        contract_items(
          *,
          product:products(id, name, type, unit)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  // Função auxiliar para calcular primeira próxima data de cobrança
  const calculateFirstNextBillingDate = async (
    startDate: string,
    billingType: string,
    billingDay: number
  ): Promise<string> => {
    const { data, error } = await supabase
      .rpc('calculate_first_next_billing_date', {
        p_start_date: startDate,
        p_billing_type: billingType,
        p_billing_day: billingDay
      });

    if (error) throw error;
    return data;
  };

  // Função auxiliar para calcular próxima data de cobrança (cobranças recorrentes)
  const calculateNextBillingDate = async (
    currentBillingDate: string,
    billingType: string,
    billingDay: number
  ): Promise<string> => {
    const { data, error } = await supabase
      .rpc('calculate_next_billing_date_v2', {
        p_current_billing_date: currentBillingDate,
        p_billing_type: billingType,
        p_billing_day: billingDay
      });

    if (error) throw error;
    return data;
  };

  return {
    contracts,
    isLoading,
    error,
    createContract,
    updateContract,
    deleteContract,
    activateContract,
    pauseContract,
    cancelContract,
    cancelContractWithFee,
    getContract,
    refetch: fetchContracts,
  };
}