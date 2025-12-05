import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, PackageFormData } from '@/lib/types/package';
import { useCompany } from '@/lib/contexts/company-context';

export function usePackages() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Estabilizar a instância do cliente Supabase
  const supabase = useMemo(() => createClient(), []);

  const fetchPackages = useCallback(async () => {
    if (!selectedCompanyId) {
      setPackages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from('packages')
        .select(`
          *,
          package_items(
            *,
            product:products(id, name, type, unit, price)
          )
        `)
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('name');

      if (queryError) throw queryError;
      setPackages(data || []);
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const createPackage = async (data: PackageFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const { items, ...packageData } = data;

    // Create the package
    const { data: newPackage, error: packageError } = await supabase
      .from('packages')
      .insert([{
        ...packageData,
        company_id: selectedCompanyId,
        is_active: data.is_active ?? true,
      }])
      .select('id')
      .single();

    if (packageError) throw packageError;

    // Create package items if any
    if (newPackage && items && items.length > 0) {
      const packageItems = items.map(item => ({
        package_id: newPackage.id,
        product_id: item.product_id,
        quantity: item.quantity ?? 1,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('package_items')
        .insert(packageItems);

      if (itemsError) throw itemsError;
    }

    await fetchPackages();
    return newPackage;
  };

  const updatePackage = async (id: string, data: Partial<PackageFormData>) => {
    const { items, ...packageData } = data;

    // Update package data
    if (Object.keys(packageData).length > 0) {
      const { error: packageError } = await supabase
        .from('packages')
        .update(packageData)
        .eq('id', id);

      if (packageError) throw packageError;
    }

    // If items are provided, replace all items
    if (items !== undefined) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('package_items')
        .delete()
        .eq('package_id', id);

      if (deleteError) throw deleteError;

      // Insert new items
      if (items.length > 0) {
        const packageItems = items.map(item => ({
          package_id: id,
          product_id: item.product_id,
          quantity: item.quantity ?? 1,
          notes: item.notes,
        }));

        const { error: itemsError } = await supabase
          .from('package_items')
          .insert(packageItems);

        if (itemsError) throw itemsError;
      }
    }

    await fetchPackages();
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase
      .from('packages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchPackages();
  };

  const getPackage = async (id: string): Promise<Package | null> => {
    const { data, error } = await supabase
      .from('packages')
      .select(`
        *,
        package_items(
          *,
          product:products(id, name, type, unit, price)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  const getActivePackages = useCallback(() => {
    return packages.filter(p => p.is_active);
  }, [packages]);

  return {
    packages,
    isLoading,
    error,
    createPackage,
    updatePackage,
    deletePackage,
    getPackage,
    getActivePackages,
    refetch: fetchPackages,
  };
}
