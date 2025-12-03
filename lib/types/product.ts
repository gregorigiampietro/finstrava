import { ProductCategory } from './product-category';

export interface Product {
  id: string;
  company_id: string;
  category_id?: string | null;
  name: string;
  description?: string;
  type: 'product' | 'service';
  price?: number;
  unit?: string;
  is_recurring: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  category?: ProductCategory;
}

export interface ProductFormData {
  name: string;
  category_id?: string | null;
  description?: string;
  type: 'product' | 'service';
  price?: number;
  unit?: string;
  is_recurring?: boolean;
  is_active?: boolean;
}