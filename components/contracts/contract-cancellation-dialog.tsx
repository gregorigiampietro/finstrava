'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Contract } from '@/lib/types/contract';
import { ContractCancellationData } from '@/lib/types/financial-entry';
import { useCompanySettings } from '@/lib/hooks/use-company-settings';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  contract_id: z.string().min(1, 'ID do contrato é obrigatório'),
  cancellation_reason: z.string().min(1, 'Selecione um motivo'),
  cancellation_details: z.string().optional(),
  cancellation_date: z.string().min(1, 'Data é obrigatória'),
  cancellation_fee: z.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContractCancellationDialogProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ContractCancellationData) => void;
}

export function ContractCancellationDialog({
  contract,
  isOpen,
  onClose,
  onConfirm,
}: ContractCancellationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings, getActiveCancellationReasons } = useCompanySettings();
  const activeReasons = getActiveCancellationReasons();

  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [feeValue, setFeeValue] = useState<number>(0);

  const selectedReason = activeReasons.find(r => r.id === selectedReasonId);
  const requiresDetails = selectedReason?.requires_details || false;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: contract?.id || '',
      cancellation_reason: '',
      cancellation_details: '',
      cancellation_date: new Date().toISOString().split('T')[0],
      cancellation_fee: 0,
    },
  });

  // Carregar multa padrão quando settings carregar
  useEffect(() => {
    if (settings?.default_cancellation_fee !== undefined) {
      setFeeValue(settings.default_cancellation_fee);
      form.setValue('cancellation_fee', settings.default_cancellation_fee);
    }
  }, [settings, form]);

  // Reset form quando modal abre
  useEffect(() => {
    if (isOpen && contract) {
      form.reset({
        contract_id: contract.id,
        cancellation_reason: '',
        cancellation_details: '',
        cancellation_date: new Date().toISOString().split('T')[0],
        cancellation_fee: settings?.default_cancellation_fee || 0,
      });
      setSelectedReasonId('');
      setFeeValue(settings?.default_cancellation_fee || 0);
    }
  }, [isOpen, contract, settings, form]);

  const handleReasonChange = (value: string) => {
    setSelectedReasonId(value);
    const reason = activeReasons.find(r => r.id === value);
    if (reason) {
      form.setValue('cancellation_reason', reason.name);
      // Limpar detalhes se o motivo não exigir
      if (!reason.requires_details) {
        form.setValue('cancellation_details', '');
      }
    }
  };

  const handleFeeChange = (value: number) => {
    setFeeValue(value);
    form.setValue('cancellation_fee', value);
  };

  const handleSubmit = async (data: FormData) => {
    // Validar detalhes se necessário
    if (requiresDetails && !data.cancellation_details?.trim()) {
      form.setError('cancellation_details', {
        message: 'Por favor, descreva o motivo do cancelamento',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combinar motivo + detalhes se houver
      let fullReason = data.cancellation_reason;
      if (data.cancellation_details?.trim()) {
        fullReason += `: ${data.cancellation_details.trim()}`;
      }

      await onConfirm({
        contract_id: contract!.id,
        cancellation_reason: fullReason,
        cancellation_date: data.cancellation_date,
        cancellation_fee: data.cancellation_fee || 0,
      });
      form.reset();
      setSelectedReasonId('');
      onClose();
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!contract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Contrato</DialogTitle>
          <DialogDescription>
            Informe os detalhes do cancelamento do contrato
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">{contract.title}</p>
              <p className="text-sm">Cliente: {contract.customer?.name}</p>
              <p className="text-sm">Valor mensal: {formatCurrency(contract.monthly_value)}</p>
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cancellation_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo do Cancelamento *</FormLabel>
                  <Select
                    value={selectedReasonId}
                    onValueChange={handleReasonChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um motivo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeReasons.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiresDetails && (
              <FormField
                control={form.control}
                name="cancellation_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descreva o motivo *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente o motivo do cancelamento..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="cancellation_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Cancelamento *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Os lançamentos após esta data serão cancelados
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Multa por Cancelamento (R$)</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={feeValue}
                  onChange={handleFeeChange}
                  placeholder="0,00"
                />
              </FormControl>
              <FormDescription>
                {settings?.default_cancellation_fee ? (
                  <>Valor padrão: {formatCurrency(settings.default_cancellation_fee)}. Altere se necessário.</>
                ) : (
                  <>Se houver multa contratual, informe o valor</>
                )}
              </FormDescription>
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || !selectedReasonId}
              >
                {isSubmitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
