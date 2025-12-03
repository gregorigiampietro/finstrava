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
import { Department, DepartmentFormData } from '@/lib/types/department';
import { useDepartments } from '@/lib/hooks/use-departments';
import { CurrencyInput } from '@/components/ui/currency-input';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  code: z.string().max(20, 'Código muito longo').optional().or(z.literal('')),
  parent_id: z.string().optional().nullable(),
  description: z.string().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  cost_center_code: z.string().max(50, 'Código de centro de custo muito longo').optional().or(z.literal('')),
  budget_monthly: z.number().min(0, 'Orçamento não pode ser negativo').optional(),
  is_active: z.boolean().default(true),
});

interface DepartmentFormProps {
  department?: Department;
  parentId?: string | null;
  onSubmit: (data: DepartmentFormData) => void;
  onCancel: () => void;
}

export function DepartmentForm({ department, parentId, onSubmit, onCancel }: DepartmentFormProps) {
  const { getDepartmentsFlat, canBeParent } = useDepartments();
  const departmentsFlat = getDepartmentsFlat();

  // Filtrar departamentos que podem ser pai (excluir o próprio e seus descendentes)
  const availableParents = department
    ? departmentsFlat.filter(d => canBeParent(department.id, d.department.id))
    : departmentsFlat;

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: department?.name || '',
      code: department?.code || '',
      parent_id: department?.parent_id || parentId || null,
      description: department?.description || '',
      cost_center_code: department?.cost_center_code || '',
      budget_monthly: department?.budget_monthly || 0,
      is_active: department?.is_active ?? true,
    },
  });

  const handleSubmit = (data: DepartmentFormData) => {
    const formattedData = {
      ...data,
      code: data.code || undefined,
      parent_id: data.parent_id || null,
      description: data.description || undefined,
      cost_center_code: data.cost_center_code || undefined,
      budget_monthly: data.budget_monthly || undefined,
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
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do departamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: TI, RH, FIN" {...field} />
                </FormControl>
                <FormDescription>
                  Código único do departamento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento Pai</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum (raiz)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (raiz)</SelectItem>
                    {availableParents.map(({ department: dept, path }) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Deixe vazio para departamento raiz
                </FormDescription>
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
                  placeholder="Descrição do departamento"
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
            name="cost_center_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Custo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: CC-001" {...field} />
                </FormControl>
                <FormDescription>
                  Código para integração financeira
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget_monthly"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orçamento Mensal</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value || 0}
                    onChange={field.onChange}
                    placeholder="R$ 0,00"
                  />
                </FormControl>
                <FormDescription>
                  Orçamento mensal do departamento
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
                  Departamento disponível para uso
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
            {department ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
