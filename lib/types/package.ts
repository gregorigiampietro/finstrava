import { Product } from './product';

export interface Package {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relations
  package_items?: PackageItem[];
}

export interface PackageItem {
  id: string;
  package_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  // Relations
  product?: Product;
}

export interface PackageFormData {
  name: string;
  description?: string;
  monthly_price: number;
  is_active?: boolean;
  notes?: string;
  items: PackageItemFormData[];
}

export interface PackageItemFormData {
  product_id: string;
  quantity?: number;
  notes?: string;
}
