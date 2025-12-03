import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CompanySettings, CancellationReason, CancellationReasonFormData } from '@/lib/types/settings';
import { useCompany } from '@/lib/contexts/company-context';

export function useCompanySettings() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [cancellationReasons, setCancellationReasons] = useState<CancellationReason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    if (!selectedCompanyId) {
      setSettings(null);
      setCancellationReasons([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Buscar configurações
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }
      setSettings(settingsData);

      // Buscar motivos de cancelamento
      const { data: reasonsData, error: reasonsError } = await supabase
        .from('cancellation_reasons')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('display_order', { ascending: true });

      if (reasonsError) throw reasonsError;
      setCancellationReasons(reasonsData || []);

    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Atualizar configurações
  const updateSettings = async (data: Partial<CompanySettings>) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const { error } = await supabase
      .from('company_settings')
      .upsert({
        company_id: selectedCompanyId,
        ...data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id',
      });

    if (error) throw error;
    await fetchSettings();
  };

  // Criar motivo de cancelamento
  const createCancellationReason = async (data: CancellationReasonFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const maxOrder = Math.max(...cancellationReasons.map(r => r.display_order), 0);

    const { error } = await supabase
      .from('cancellation_reasons')
      .insert({
        company_id: selectedCompanyId,
        ...data,
        display_order: data.display_order ?? maxOrder + 1,
        is_active: data.is_active ?? true,
        requires_details: data.requires_details ?? false,
      });

    if (error) throw error;
    await fetchSettings();
  };

  // Atualizar motivo de cancelamento
  const updateCancellationReason = async (id: string, data: Partial<CancellationReasonFormData>) => {
    const { error } = await supabase
      .from('cancellation_reasons')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await fetchSettings();
  };

  // Deletar motivo de cancelamento
  const deleteCancellationReason = async (id: string) => {
    const { error } = await supabase
      .from('cancellation_reasons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchSettings();
  };

  // Reordenar motivos
  const reorderCancellationReasons = async (reasons: { id: string; display_order: number }[]) => {
    for (const reason of reasons) {
      await supabase
        .from('cancellation_reasons')
        .update({ display_order: reason.display_order })
        .eq('id', reason.id);
    }
    await fetchSettings();
  };

  // Helpers
  const getActiveCancellationReasons = () => {
    return cancellationReasons.filter(r => r.is_active);
  };

  return {
    settings,
    cancellationReasons,
    isLoading,
    error,
    updateSettings,
    createCancellationReason,
    updateCancellationReason,
    deleteCancellationReason,
    reorderCancellationReasons,
    getActiveCancellationReasons,
    refetch: fetchSettings,
  };
}
