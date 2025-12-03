import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Payroll, PayrollItem, PayrollFormData } from '@/lib/types/payroll';
import { useCompany } from '@/lib/contexts/company-context';

export function usePayrolls() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchPayrolls = useCallback(async () => {
    if (!selectedCompanyId) {
      setPayrolls([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payrolls')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('reference_month', { ascending: false });

      if (error) throw error;
      setPayrolls(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const createPayroll = async (data: PayrollFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const { error } = await supabase
      .from('payrolls')
      .insert([{
        ...data,
        company_id: selectedCompanyId,
        status: 'draft',
      }]);

    if (error) throw error;
    await fetchPayrolls();
  };

  const updatePayroll = async (id: string, data: Partial<PayrollFormData>) => {
    const { error } = await supabase
      .from('payrolls')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    await fetchPayrolls();
  };

  const deletePayroll = async (id: string) => {
    const { error } = await supabase
      .from('payrolls')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchPayrolls();
  };

  const getPayroll = async (id: string): Promise<Payroll | null> => {
    const { data, error } = await supabase
      .from('payrolls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  const getPayrollItems = async (payrollId: string): Promise<PayrollItem[]> => {
    const { data, error } = await supabase
      .from('payroll_items')
      .select(`
        *,
        employee:employees!payroll_items_employee_id_fkey(id, name, cpf),
        department:departments!payroll_items_department_id_fkey(id, name),
        position:positions!payroll_items_position_id_fkey(id, name)
      `)
      .eq('payroll_id', payrollId);

    if (error) throw error;

    // Ordenar por nome do funcionário no cliente
    return (data || []).sort((a, b) =>
      (a.employee?.name || '').localeCompare(b.employee?.name || '')
    );
  };

  // Calcular folha (adicionar funcionários)
  const calculatePayroll = async (payrollId: string) => {
    const { data, error } = await supabase
      .rpc('calculate_payroll', { p_payroll_id: payrollId });

    if (error) throw error;
    await fetchPayrolls();
    return data;
  };

  // Aprovar folha
  const approvePayroll = async (payrollId: string) => {
    const { error } = await supabase
      .from('payrolls')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', payrollId);

    if (error) throw error;
    await fetchPayrolls();
  };

  // Gerar lançamentos financeiros
  const generateFinancialEntries = async (payrollId: string) => {
    const { data, error } = await supabase
      .rpc('generate_payroll_financial_entries', { p_payroll_id: payrollId });

    if (error) throw error;
    await fetchPayrolls();
    return data;
  };

  // Cancelar folha
  const cancelPayroll = async (payrollId: string) => {
    const { error } = await supabase
      .from('payrolls')
      .update({ status: 'cancelled' })
      .eq('id', payrollId);

    if (error) throw error;
    await fetchPayrolls();
  };

  // Atualizar item da folha
  const updatePayrollItem = async (itemId: string, data: Partial<PayrollItem>) => {
    const { error } = await supabase
      .from('payroll_items')
      .update(data)
      .eq('id', itemId);

    if (error) throw error;
  };

  // Recalcular totais da folha
  const recalculatePayrollTotals = async (payrollId: string) => {
    const items = await getPayrollItems(payrollId);

    const total_gross = items.reduce((sum, item) => sum + (item.gross_salary || 0), 0);
    const total_deductions = items.reduce((sum, item) => sum + (item.total_deductions || 0), 0);
    const total_net = items.reduce((sum, item) => sum + (item.net_salary || 0), 0);

    await updatePayroll(payrollId, {
      total_gross,
      total_deductions,
      total_net,
    } as Partial<PayrollFormData>);
  };

  return {
    payrolls,
    isLoading,
    error,
    createPayroll,
    updatePayroll,
    deletePayroll,
    getPayroll,
    getPayrollItems,
    calculatePayroll,
    approvePayroll,
    generateFinancialEntries,
    cancelPayroll,
    updatePayrollItem,
    recalculatePayrollTotals,
    refetch: fetchPayrolls,
  };
}
