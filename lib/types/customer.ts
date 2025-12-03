export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  document_type?: 'cpf' | 'cnpj';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  is_active: boolean;
  status?: 'lead' | 'active' | 'churned';
  first_payment_at?: string | null;
  churned_at?: string | null;
  churn_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  document_type?: 'cpf' | 'cnpj';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  is_active?: boolean;
}