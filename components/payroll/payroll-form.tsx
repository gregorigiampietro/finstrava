'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { PayrollFormData } from '@/lib/types/payroll';

const formSchema = z.object({
  reference_month: z.string().min(1, 'Mês de referência é obrigatório'),
  payment_date: z.string().min(1, 'Data de pagamento é obrigatória'),
  notes: z.string().optional(),
});

interface PayrollFormProps {
  onSubmit: (data: PayrollFormData) => void;
  onCancel: () => void;
}

export function PayrollForm({ onSubmit, onCancel }: PayrollFormProps) {
  // Pegar o primeiro dia do mês atual como padrão
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0];
  const defaultPaymentDay = new Date(today.getFullYear(), today.getMonth(), 5)
    .toISOString().split('T')[0];

  const form = useForm<PayrollFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference_month: firstDayOfMonth,
      payment_date: defaultPaymentDay,
      notes: '',
    },
  });

  const handleSubmit = (data: PayrollFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reference_month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mês de Referência *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                Selecione o primeiro dia do mês de referência
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Pagamento *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                Data prevista para pagamento dos salários
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre esta folha"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Criar Folha
          </Button>
        </div>
      </form>
    </Form>
  );
}
