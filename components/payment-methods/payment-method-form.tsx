'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { PaymentMethod, PaymentMethodFormData } from '@/lib/types/payment-method';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  is_active: z.boolean().optional(),
  allows_installments: z.boolean().optional(),
  max_installments: z.number().min(1).max(99).optional(),
}).refine((data) => {
  if (data.allows_installments && (!data.max_installments || data.max_installments < 1)) {
    return false;
  }
  return true;
}, {
  message: 'Número máximo de parcelas é obrigatório quando permite parcelamento',
  path: ['max_installments'],
});

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  onSubmit: (data: PaymentMethodFormData) => void;
  onCancel: () => void;
}

export function PaymentMethodForm({ paymentMethod, onSubmit, onCancel }: PaymentMethodFormProps) {
  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: paymentMethod?.name || '',
      is_active: paymentMethod?.is_active ?? true,
      allows_installments: paymentMethod?.allows_installments || false,
      max_installments: paymentMethod?.max_installments || undefined,
    },
  });

  const allowsInstallments = form.watch('allows_installments');

  useEffect(() => {
    if (!allowsInstallments) {
      form.setValue('max_installments', undefined);
    }
  }, [allowsInstallments, form]);

  const handleSubmit = (data: PaymentMethodFormData) => {
    const formattedData = {
      ...data,
      max_installments: data.allows_installments ? data.max_installments : undefined,
    };
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Cartão de Crédito" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativo</FormLabel>
                <FormDescription>
                  Forma de pagamento disponível para uso
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allows_installments"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Permite Parcelamento</FormLabel>
                <FormDescription>
                  Habilitar opção de dividir pagamentos em parcelas
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {allowsInstallments && (
          <FormField
            control={form.control}
            name="max_installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número Máximo de Parcelas</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ex: 12" 
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {paymentMethod ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}