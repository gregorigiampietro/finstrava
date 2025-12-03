export interface ProductCategory {
  id: string;
  company_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relations
  parent?: ProductCategory;
  children?: ProductCategory[];
  products_count?: number;
}

export interface ProductCategoryFormData {
  name: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Helper type for tree structure
export interface ProductCategoryTree extends ProductCategory {
  children: ProductCategoryTree[];
  level: number;
}
