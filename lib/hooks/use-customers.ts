import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerFormData } from '@/lib/types/customer';
import { useCompany } from '@/lib/contexts/company-context';

export function useCustomers() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchCustomers = useCallback(async () => {
    if (!selectedCompanyId) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const createCustomer = async (data: CustomerFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    // Filtrar campos undefined
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const { error } = await supabase
      .from('customers')
      .insert([{ ...cleanData, company_id: selectedCompanyId }]);

    if (error) throw error;
    await fetchCustomers();
  };

  const updateCustomer = async (id: string, data: CustomerFormData) => {
    // Filtrar campos undefined
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const { error } = await supabase
      .from('customers')
      .update(cleanData)
      .eq('id', id);

    if (error) throw error;
    await fetchCustomers();
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchCustomers();
  };

  const getCustomer = async (id: string): Promise<Customer | null> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  return {
    customers,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    refetch: fetchCustomers,
  };
}