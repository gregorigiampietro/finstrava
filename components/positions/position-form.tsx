'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  FormMessage
} from '@/components/ui/form';
import { Position, PositionFormData } from '@/lib/types/position';
import { useDepartments } from '@/lib/hooks/use-departments';
import { CurrencyInput } from '@/components/ui/currency-input';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  department_id: z.string().optional().nullable(),
  description: z.string().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  salary_range_min: z.number().min(0, 'Valor não pode ser negativo').optional(),
  salary_range_max: z.number().min(0, 'Valor não pode ser negativo').optional(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  if (data.salary_range_min && data.salary_range_max) {
    return data.salary_range_max >= data.salary_range_min;
  }
  return true;
}, {
  message: 'O salário máximo deve ser maior ou igual ao mínimo',
  path: ['salary_range_max'],
});

interface PositionFormProps {
  position?: Position;
  onSubmit: (data: PositionFormData) => void;
  onCancel: () => void;
}

export function PositionForm({ position, onSubmit, onCancel }: PositionFormProps) {
  const { getDepartmentsFlat } = useDepartments();
  const departmentsFlat = getDepartmentsFlat();

  const form = useForm<PositionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: position?.name || '',
      department_id: position?.department_id || null,
      description: position?.description || '',
      salary_range_min: position?.salary_range_min || 0,
      salary_range_max: position?.salary_range_max || 0,
      is_active: position?.is_active ?? true,
    },
  });

  const handleSubmit = (data: PositionFormData) => {
    const formattedData = {
      ...data,
      department_id: data.department_id || null,
      description: data.description || undefined,
      salary_range_min: data.salary_range_min || undefined,
      salary_range_max: data.salary_range_max || undefined,
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
              <FormLabel>Nome do Cargo *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Analista de Sistemas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                value={field.value || 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum (geral)</SelectItem>
                  {departmentsFlat.map(({ department, path }) => (
                    <SelectItem key={department.id} value={department.id}>
                      {path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Departamento ao qual o cargo pertence
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição das responsabilidades do cargo"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="salary_range_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salário Mínimo</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    placeholder="R$ 0,00"
                  />
                </FormControl>
                <FormDescription>
                  Faixa salarial mínima
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary_range_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salário Máximo</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    placeholder="R$ 0,00"
                  />
                </FormControl>
                <FormDescription>
                  Faixa salarial máxima
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativo</FormLabel>
                <FormDescription>
                  Cargo disponível para novos funcionários
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {position ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
