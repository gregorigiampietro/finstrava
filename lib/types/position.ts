export interface Position {
  id: string;
  company_id: string;
  department_id?: string;
  name: string;
  description?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relações
  department?: { id: string; name: string };
  employee_count?: number;
}

export interface PositionFormData {
  name: string;
  department_id?: string | null;
  description?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  is_active?: boolean;
}
