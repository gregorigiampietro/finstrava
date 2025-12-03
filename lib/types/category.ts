export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  company_id: string;
  name: string;
  type: CategoryType;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  parent_id?: string | null;
  description?: string | null;
  is_active?: boolean;
}