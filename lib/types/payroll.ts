export type PayrollStatus = 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
export type PayrollItemStatus = 'pending' | 'paid' | 'cancelled';

export interface Payroll {
  id: string;
  company_id: string;
  reference_month: string;
  payment_date: string;
  status: PayrollStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relações
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  payroll_id: string;
  employee_id: string;
  department_id?: string;
  position_id?: string;
  base_salary: number;
  overtime_hours: number;
  overtime_value: number;
  bonuses: number;
  commissions: number;
  other_earnings: number;
  total_earnings: number;
  inss_deduction: number;
  irrf_deduction: number;
  other_deductions: number;
  total_deductions: number;
  gross_salary: number;
  net_salary: number;
  financial_entry_id?: string;
  status: PayrollItemStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relações
  employee?: { id: string; name: string; cpf?: string };
  department?: { id: string; name: string };
  position?: { id: string; name: string };
}

export interface PayrollFormData {
  reference_month: string;
  payment_date: string;
  notes?: string;
}

export const payrollStatusLabels: Record<PayrollStatus, string> = {
  draft: 'Rascunho',
  calculated: 'Calculada',
  approved: 'Aprovada',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

export const payrollStatusColors: Record<PayrollStatus, string> = {
  draft: 'secondary',
  calculated: 'outline',
  approved: 'default',
  paid: 'default',
  cancelled: 'destructive',
};

export const payrollItemStatusLabels: Record<PayrollItemStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelado',
};
