export interface FinancialEntry {
  id: string;
  company_id: string;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  payment_amount?: number;
  due_date: string;
  payment_date?: string;
  category_id?: string;
  payment_method_id?: string;
  customer_id?: string;
  supplier_id?: string;
  bank_account_id?: string;
  product_id?: string;
  contract_id?: string;
  contract_item_id?: string;
  description: string;
  notes?: string;
  attachments?: string[];
  installment?: number;
  total_installments?: number;
  parent_transaction_id?: string;
  is_recurring: boolean;
  is_contract_generated: boolean;
  recurring_type?: string;
  recurring_day?: number;
  reconciled: boolean;
  cancellation_reason?: string;
  cancellation_fee?: number;
  cancelled_at?: string;
  cancelled_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  supplier?: {
    id: string;
    name: string;
    email?: string;
  };
  category?: {
    id: string;
    name: string;
    type: 'income' | 'expense';
  };
  payment_method?: {
    id: string;
    name: string;
  };
  contract?: {
    id: string;
    title: string;
    contract_number?: string;
  };
  bank_account?: {
    id: string;
    name: string;
    bank_name: string;
  };
}

export interface FinancialEntryFormData {
  type: 'income' | 'expense';
  amount: number;
  due_date: string;
  category_id?: string;
  payment_method_id?: string;
  customer_id?: string;
  supplier_id?: string;
  bank_account_id?: string;
  description: string;
  notes?: string;
  is_recurring: boolean;
  recurring_type?: string;
  recurring_day?: number;
  installments?: number;
}

export interface ContractCancellationData {
  contract_id: string;
  cancellation_reason: string;
  cancellation_fee?: number;
  cancellation_date?: string;
}