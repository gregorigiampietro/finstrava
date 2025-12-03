import { createClient } from '@/lib/supabase/client';
import { Category, CategoryFormData } from '@/lib/types/category';

export async function getCategories(companyId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('type')
    .order('name');

  if (error) throw error;
  return data as Category[];
}

export async function getCategoriesByType(companyId: string, type: 'income' | 'expense') {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', companyId)
    .eq('type', type)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  if (error) throw error;
  return data as Category[];
}

export async function getCategory(id: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Category;
}

export async function createCategory(companyId: string, category: CategoryFormData) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      ...category,
      company_id: companyId,
      is_active: category.is_active ?? true
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, category: Partial<CategoryFormData>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const supabase = createClient();

  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

