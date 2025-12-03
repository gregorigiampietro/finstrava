export interface Transaction {
  id: string
  company_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  due_date: string
  payment_date?: string | null
  status: 'pending' | 'paid' | 'cancelled' | 'overdue'
  category_id?: string | null
  category?: {
    id: string
    name: string
    type: 'income' | 'expense'
    color?: string | null
  }
  payment_method_id?: string | null
  payment_method?: {
    id: string
    name: string
    type?: string | null
  }
  customer_id?: string | null
  customer?: {
    id: string
    name: string
    document?: string | null
  }
  supplier_id?: string | null
  supplier?: {
    id: string
    name: string
    document?: string | null
  }
  bank_account_id?: string | null
  bank_account?: {
    id: string
    name: string
    bank_name?: string | null
  }
  product_id?: string | null
  product?: {
    id: string
    name: string
    type: 'product' | 'service'
  }
  contract_id?: string | null
  contract?: {
    id: string
    title: string
    contract_number?: string | null
    package?: {
      id: string
      name: string
    } | null
  }
  is_contract_generated?: boolean
  installment?: number | null
  total_installments?: number | null
  billing_cycle_number?: number | null
  notes?: string | null
  attachments?: string[] | null
  created_at: string
  updated_at: string
}

export interface TransactionFormData {
  type: 'income' | 'expense'
  amount: number
  description: string
  due_date: string
  payment_date?: string | null
  category_id?: string | null
  payment_method_id?: string | null
  customer_id?: string | null
  supplier_id?: string | null
  bank_account_id?: string | null
  product_id?: string | null
  installments?: number
  notes?: string | null
}

export interface TransactionFilters {
  type?: 'income' | 'expense'
  status?: 'pending' | 'paid' | 'cancelled' | 'overdue'
  category_id?: string
  payment_method_id?: string
  customer_id?: string
  supplier_id?: string
  date_from?: string
  date_to?: string
  search?: string
}