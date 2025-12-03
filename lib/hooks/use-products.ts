import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product, ProductFormData } from '@/lib/types/product';
import { useCompany } from '@/lib/contexts/company-context';

export function useProducts() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchProducts = useCallback(async () => {
    if (!selectedCompanyId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name, color, parent_id)
        `)
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: ProductFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    // Filtrar campos undefined
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const { error } = await supabase
      .from('products')
      .insert([{ ...cleanData, company_id: selectedCompanyId }]);

    if (error) throw error;
    await fetchProducts();
  };

  const updateProduct = async (id: string, data: ProductFormData) => {
    // Filtrar campos undefined
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const { error } = await supabase
      .from('products')
      .update(cleanData)
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  };

  const getProduct = async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name, color, parent_id)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    refetch: fetchProducts,
  };
}