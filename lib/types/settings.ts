export interface CompanySettings {
  id: string;
  company_id: string;
  default_cancellation_fee: number;
  include_pj_in_payroll: boolean;
  created_at: string;
  updated_at: string;
}

export interface CancellationReason {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  requires_details: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CancellationReasonFormData {
  name: string;
  description?: string;
  requires_details?: boolean;
  is_active?: boolean;
  display_order?: number;
}
