export interface PaymentMethod {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  allows_installments: boolean;
  max_installments?: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodFormData {
  name: string;
  is_active?: boolean;
  allows_installments?: boolean;
  max_installments?: number;
}