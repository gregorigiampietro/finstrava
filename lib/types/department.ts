export interface Department {
  id: string;
  company_id: string;
  parent_id: string | null;
  name: string;
  code?: string;
  description?: string;
  cost_center_code?: string;
  budget_monthly?: number;
  manager_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relações
  children?: Department[];
  parent?: Department;
  manager?: { id: string; name: string };
  employee_count?: number;
}

export interface DepartmentFormData {
  name: string;
  code?: string;
  parent_id?: string | null;
  description?: string;
  cost_center_code?: string;
  budget_monthly?: number;
  manager_id?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface DepartmentTree extends Department {
  children: DepartmentTree[];
  level: number;
}
