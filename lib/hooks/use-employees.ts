import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, EmployeeFormData } from '@/lib/types/employee';
import { useCompany } from '@/lib/contexts/company-context';

export function useEmployees() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchEmployees = useCallback(async () => {
    if (!selectedCompanyId) {
      setEmployees([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments!employees_department_id_fkey(id, name),
          position:positions!employees_position_id_fkey(id, name),
          default_category:categories(id, name),
          default_payment_method:payment_methods(id, name),
          default_bank_account:bank_accounts(id, name)
        `)
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const createEmployee = async (data: EmployeeFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    const { error } = await supabase
      .from('employees')
      .insert([{
        ...cleanData,
        company_id: selectedCompanyId,
        is_active: true,
        status: data.status || 'active',
        contract_type: data.contract_type || 'clt',
        work_hours: data.work_hours || 44,
        payment_day: data.payment_day || 5,
        department_id: data.department_id || null,
        position_id: data.position_id || null,
        default_category_id: data.default_category_id || null,
        default_payment_method_id: data.default_payment_method_id || null,
        default_bank_account_id: data.default_bank_account_id || null,
      }]);

    if (error) throw error;
    await fetchEmployees();
  };

  const updateEmployee = async (id: string, data: Partial<EmployeeFormData>) => {
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value === '' ? null : value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    // Garantir que FKs opcionais sejam null se vazias
    const fkFields = ['department_id', 'position_id', 'default_category_id', 'default_payment_method_id', 'default_bank_account_id'];
    fkFields.forEach(field => {
      if (field in cleanData) {
        cleanData[field] = cleanData[field] || null;
      }
    });

    const { error } = await supabase
      .from('employees')
      .update(cleanData)
      .eq('id', id);

    if (error) throw error;
    await fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchEmployees();
  };

  const getEmployee = async (id: string): Promise<Employee | null> => {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments!employees_department_id_fkey(id, name),
        position:positions!employees_position_id_fkey(id, name),
        default_category:categories(id, name),
        default_payment_method:payment_methods(id, name),
        default_bank_account:bank_accounts(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  // Obter funcionários por departamento
  const getEmployeesByDepartment = useCallback((departmentId: string) => {
    return employees.filter(e => e.department_id === departmentId && e.status === 'active');
  }, [employees]);

  // Obter funcionários ativos
  const getActiveEmployees = useCallback(() => {
    return employees.filter(e => e.status === 'active');
  }, [employees]);

  // Obter funcionários para folha de pagamento (ativos e não PJ)
  const getPayrollEmployees = useCallback(() => {
    return employees.filter(e =>
      e.status === 'active' &&
      e.contract_type !== 'pj' &&
      e.contract_type !== 'freelancer'
    );
  }, [employees]);

  // Calcular total de salários
  const getTotalSalaries = useCallback(() => {
    return getActiveEmployees().reduce((total, emp) => total + (emp.base_salary || 0), 0);
  }, [getActiveEmployees]);

  return {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    getEmployeesByDepartment,
    getActiveEmployees,
    getPayrollEmployees,
    getTotalSalaries,
    refetch: fetchEmployees,
  };
}
