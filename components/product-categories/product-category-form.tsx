'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ProductCategory, ProductCategoryFormData } from '@/lib/types/product-category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  parent_id: z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional().or(z.literal('')),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const PRESET_COLORS = [
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Cinza', value: '#6B7280' },
  { name: 'Laranja', value: '#F97316' },
];

interface ProductCategoryFormProps {
  category?: ProductCategory;
  parentCategories: ProductCategory[];
  defaultParentId?: string | null;
  onSubmit: (data: ProductCategoryFormData) => void;
  onCancel: () => void;
}

export function ProductCategoryForm({
  category,
  parentCategories,
  defaultParentId,
  onSubmit,
  onCancel,
}: ProductCategoryFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
      parent_id: category?.parent_id || defaultParentId || null,
      description: category?.description || '',
      color: category?.color || '',
      is_active: category?.is_active ?? true,
    },
  });

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      parent_id: values.parent_id || null,
      color: values.color || undefined,
    });
  };

  const selectedColor = form.watch('color');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Tráfego Pago" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria Pai</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                value={field.value || 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                  {parentCategories
                    .filter(c => c.id !== category?.id) // Can't be parent of itself
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Deixe vazio para criar uma categoria principal
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
                  placeholder="Descrição da categoria..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => field.onChange(color.value)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <FormDescription>
                Escolha uma cor para identificar visualmente a categoria
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
                <FormLabel className="text-base">Categoria Ativa</FormLabel>
                <FormDescription>
                  Categorias inativas não aparecem na seleção de produtos
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
            {category ? 'Salvar Alterações' : 'Criar Categoria'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
