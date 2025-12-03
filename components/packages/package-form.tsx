'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Package, PackageFormData, PackageItemFormData } from '@/lib/types/package';
import { useProducts } from '@/lib/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package as PackageIcon } from 'lucide-react';
import { ProductSelector } from './product-selector';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  monthly_price: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  is_active: z.boolean(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PackageFormProps {
  package?: Package;
  onSubmit: (data: PackageFormData) => void;
  onCancel: () => void;
}

export function PackageForm({ package: pkg, onSubmit, onCancel }: PackageFormProps) {
  const { products } = useProducts();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: pkg?.name || '',
      description: pkg?.description || '',
      monthly_price: pkg?.monthly_price || 0,
      is_active: pkg?.is_active ?? true,
      notes: pkg?.notes || '',
    },
  });

  // Load existing items when editing
  useEffect(() => {
    if (pkg?.package_items) {
      setSelectedProductIds(pkg.package_items.map(item => item.product_id));
    }
  }, [pkg]);

  const handleFormSubmit = (values: FormValues) => {
    const items: PackageItemFormData[] = selectedProductIds.map(productId => ({
      product_id: productId,
      quantity: 1,
    }));

    onSubmit({
      ...values,
      items,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Pacote *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Start, PRO, Premium..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthly_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Mensal *</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0,00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o que está incluído neste pacote..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Products/Services Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PackageIcon className="h-4 w-4" />
              Serviços Incluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSelector
              selectedProductIds={selectedProductIds}
              onSelectionChange={setSelectedProductIds}
            />
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações Internas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas internas sobre este pacote..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Visível apenas para administradores
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Pacote Ativo</FormLabel>
                <FormDescription>
                  Pacotes inativos não aparecem na criação de contratos
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {pkg ? 'Salvar Alterações' : 'Criar Pacote'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
