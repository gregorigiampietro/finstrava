import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Position, PositionFormData } from '@/lib/types/position';
import { useCompany } from '@/lib/contexts/company-context';

export function usePositions() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchPositions = useCallback(async () => {
    if (!selectedCompanyId) {
      setPositions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('positions')
        .select(`
          *,
          department:departments(id, name)
        `)
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setPositions(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const createPosition = async (data: PositionFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    const { error } = await supabase
      .from('positions')
      .insert([{
        ...cleanData,
        company_id: selectedCompanyId,
        is_active: data.is_active ?? true,
        department_id: data.department_id || null,
      }]);

    if (error) throw error;
    await fetchPositions();
  };

  const updatePosition = async (id: string, data: Partial<PositionFormData>) => {
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value === '' ? null : value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    // Garantir que department_id seja null se vazio
    if ('department_id' in cleanData) {
      cleanData.department_id = cleanData.department_id || null;
    }

    const { error } = await supabase
      .from('positions')
      .update(cleanData)
      .eq('id', id);

    if (error) throw error;
    await fetchPositions();
  };

  const deletePosition = async (id: string) => {
    const { error } = await supabase
      .from('positions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchPositions();
  };

  const getPosition = async (id: string): Promise<Position | null> => {
    const { data, error } = await supabase
      .from('positions')
      .select(`
        *,
        department:departments(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  // Obter cargos por departamento
  const getPositionsByDepartment = useCallback((departmentId: string) => {
    return positions.filter(p => p.department_id === departmentId && p.is_active);
  }, [positions]);

  // Obter cargos ativos para seleção
  const getActivePositions = useCallback(() => {
    return positions.filter(p => p.is_active);
  }, [positions]);

  return {
    positions,
    isLoading,
    error,
    createPosition,
    updatePosition,
    deletePosition,
    getPosition,
    getPositionsByDepartment,
    getActivePositions,
    refetch: fetchPositions,
  };
}
