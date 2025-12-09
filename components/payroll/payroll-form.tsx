'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { PayrollFormData } from '@/lib/types/payroll';

const formSchema = z.object({
  reference_month: z.string().min(1, 'Mês de referência é obrigatório'),
  notes: z.string().optional(),
});

const months = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

// Gerar lista de anos (atual e próximos 2 anos)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 3 }, (_, i) => currentYear + i);

interface PayrollFormProps {
  onSubmit: (data: PayrollFormData) => void;
  onCancel: () => void;
}

export function PayrollForm({ onSubmit, onCancel }: PayrollFormProps) {
  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentYear = today.getFullYear();
  
  const form = useForm<PayrollFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference_month: `${currentYear}-${currentMonth}-01`, // Sempre usar dia 01
      notes: '',
    },
  });

  const selectedMonth = form.watch('reference_month')?.substring(5, 7) || currentMonth;
  const selectedYear = form.watch('reference_month')?.substring(0, 4) || String(currentYear);

  const handleMonthYearChange = (month: string, year: string) => {
    // Sempre usar o dia 01 do mês selecionado
    form.setValue('reference_month', `${year}-${month}-01`);
  };

  const handleSubmit = (data: PayrollFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Mês *</FormLabel>
            <Select 
              value={selectedMonth} 
              onValueChange={(value) => handleMonthYearChange(value, selectedYear)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <FormItem>
            <FormLabel>Ano *</FormLabel>
            <Select 
              value={selectedYear} 
              onValueChange={(value) => handleMonthYearChange(selectedMonth, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="reference_month"
          render={() => (
            <FormItem className="hidden">
              <FormControl>
                <input type="hidden" {...form.register('reference_month')} />
              </FormControl>
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
