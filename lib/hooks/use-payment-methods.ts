import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PaymentMethod, PaymentMethodFormData } from '@/lib/types/payment-method';
import { useCompany } from '@/lib/contexts/company-context';

export function usePaymentMethods() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchPaymentMethods = useCallback(async () => {
    if (!selectedCompanyId) {
      setPaymentMethods([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const createPaymentMethod = async (data: PaymentMethodFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const { error } = await supabase
      .from('payment_methods')
      .insert([{ ...data, company_id: selectedCompanyId }]);

    if (error) throw error;
    await fetchPaymentMethods();
  };

  const updatePaymentMethod = async (id: string, data: PaymentMethodFormData) => {
    const { error } = await supabase
      .from('payment_methods')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    await fetchPaymentMethods();
  };

  const deletePaymentMethod = async (id: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchPaymentMethods();
  };


  return {
    paymentMethods,
    isLoading,
    error,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    refetch: fetchPaymentMethods,
  };
}