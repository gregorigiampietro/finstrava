'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/lib/contexts/company-context';
import { Category, CategoryFormData } from '@/lib/types/category';
import * as categoriesApi from '@/lib/api/categories';

export function useCategories(type?: 'income' | 'expense') {
  const { selectedCompany } = useCompany();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!selectedCompany?.id) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    loadCategories();
  }, [selectedCompany?.id, type]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = type 
        ? await categoriesApi.getCategoriesByType(selectedCompany!.id, type)
        : await categoriesApi.getCategories(selectedCompany!.id);
      
      setCategories(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (category: CategoryFormData) => {
    if (!selectedCompany?.id) throw new Error('No company selected');
    
    const newCategory = await categoriesApi.createCategory(selectedCompany.id, category);
    await loadCategories();
    return newCategory;
  };

  const updateCategory = async (id: string, category: Partial<CategoryFormData>) => {
    const updated = await categoriesApi.updateCategory(id, category);
    await loadCategories();
    return updated;
  };

  const deleteCategory = async (id: string) => {
    await categoriesApi.deleteCategory(id);
    await loadCategories();
  };


  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: loadCategories
  };
}