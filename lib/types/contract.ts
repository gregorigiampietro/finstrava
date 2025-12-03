export interface Contract {
  id: string;
  company_id: string;
  customer_id: string;
  contract_number?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  billing_type: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  billing_day: number;
  monthly_value: number;
  status: 'draft' | 'active' | 'paused' | 'cancelled' | 'expired';
  next_billing_date?: string;
  default_category_id?: string;
  default_payment_method_id?: string;
  grace_period_days: number;
  automatic_renewal: boolean;
  renewal_period_months: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Novos campos para controle de cobrança
  first_billing_processed?: boolean;
  first_billing_date?: string;
  created_with_first_billing?: boolean;
  contract_duration_months?: number; // Duração em meses (facilita UX)
  package_id?: string; // Pacote usado para criar o contrato

  // Relacionamentos
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  payment_method?: {
    id: string;
    name: string;
  };
  contract_items?: ContractItem[];
}

export interface ContractFormData {
  customer_id: string;
  title: string;
  description?: string;
  start_date: string;
  first_billing_date: string; // Data do primeiro pagamento (pode ser diferente de start_date)
  end_date?: string; // Opcional - pode ser calculado a partir de contract_duration_months
  contract_duration_months?: number; // Nova forma de definir duração
  billing_type: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  billing_day: number;
  monthly_value: number;
  default_category_id?: string;
  default_payment_method_id?: string;
  grace_period_days?: number;
  automatic_renewal?: boolean;
  renewal_period_months?: number;
  notes?: string;
  contract_items: ContractItemFormData[];
  package_id?: string; // Pacote usado para criar o contrato
}

export interface ContractItem {
  id: string;
  contract_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  product?: {
    id: string;
    name: string;
    type: 'product' | 'service';
    unit?: string;
  };
}

export interface ContractItemFormData {
  product_id: string;
  quantity: number;
  unit_price: number;
  description?: string;
  is_active?: boolean;
}

export interface ContractHistory {
  id: string;
  contract_id: string;
  change_type: 'created' | 'activated' | 'paused' | 'resumed' | 'cancelled' | 'price_changed' | 'billing_day_changed' | 'renewed' | 'expired';
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  old_monthly_value?: number;
  new_monthly_value?: number;
  created_at: string;
  created_by?: string;
}