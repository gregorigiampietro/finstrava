import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductCategory, ProductCategoryFormData, ProductCategoryTree } from '@/lib/types/product-category';
import { useCompany } from '@/lib/contexts/company-context';

export function useProductCategories() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    if (!selectedCompanyId) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('sort_order')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (data: ProductCategoryFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const { error } = await supabase
      .from('product_categories')
      .insert([{
        ...data,
        company_id: selectedCompanyId,
        is_active: data.is_active ?? true,
        parent_id: data.parent_id || null,
      }]);

    if (error) throw error;
    await fetchCategories();
  };

  const updateCategory = async (id: string, data: Partial<ProductCategoryFormData>) => {
    const updateData = {
      ...data,
      parent_id: data.parent_id || null,
    };

    const { error } = await supabase
      .from('product_categories')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('product_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchCategories();
  };

  // Build tree structure from flat list
  const buildCategoryTree = useCallback((): ProductCategoryTree[] => {
    const categoryMap = new Map<string, ProductCategoryTree>();
    const roots: ProductCategoryTree[] = [];

    // First pass: create all nodes
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [], level: 0 });
    });

    // Second pass: build tree structure
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  // Get flat list with hierarchy indication (for selects)
  const getCategoriesFlat = useCallback((): { category: ProductCategory; level: number; path: string }[] => {
    const result: { category: ProductCategory; level: number; path: string }[] = [];

    const traverse = (cats: ProductCategoryTree[], path: string = '') => {
      cats.forEach(cat => {
        const currentPath = path ? `${path} > ${cat.name}` : cat.name;
        result.push({ category: cat, level: cat.level, path: currentPath });
        if (cat.children.length > 0) {
          traverse(cat.children, currentPath);
        }
      });
    };

    traverse(buildCategoryTree());
    return result;
  }, [buildCategoryTree]);

  // Get only parent categories (for parent selector)
  const getParentCategories = useCallback(() => {
    return categories.filter(c => !c.parent_id && c.is_active);
  }, [categories]);

  // Get children of a specific category
  const getChildCategories = useCallback((parentId: string) => {
    return categories.filter(c => c.parent_id === parentId);
  }, [categories]);

  // Get active categories for product form
  const getActiveCategories = useCallback(() => {
    return categories.filter(c => c.is_active);
  }, [categories]);

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    buildCategoryTree,
    getCategoriesFlat,
    getParentCategories,
    getChildCategories,
    getActiveCategories,
    refetch: fetchCategories,
  };
}
