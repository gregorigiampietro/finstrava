'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCompany } from '@/lib/contexts/company-context';

const companySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  legal_name: z.string().optional(),
  cnpj: z.string()
    .optional()
    .refine(val => !val || val.replace(/\D/g, '').length === 14, 'CNPJ deve ter 14 dígitos'),
});

type CompanyFormData = {
  name: string;
  legal_name?: string;
  cnpj?: string;
};

interface CompanyFormProps {
  company?: {
    id: string;
    name: string;
    legal_name: string | null;
    cnpj: string | null;
  };
}

export function CompanyForm({ company }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { refreshCompanies } = useCompany();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      legal_name: company?.legal_name || '',
      cnpj: company?.cnpj || '',
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        router.push('/login');
        return;
      }

      // Limpar CNPJ removendo caracteres não numéricos
      const cleanCnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;

      if (company) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update({
            name: data.name,
            legal_name: data.legal_name || null,
            cnpj: cleanCnpj,
          })
          .eq('id', company.id);

        if (error) {
          console.error('Error updating company:', error);
          return;
        }
      } else {
        // Criar nova empresa
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: data.name,
            legal_name: data.legal_name || null,
            cnpj: cleanCnpj,
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
          return;
        }

        // Vincular usuário à empresa como admin
        const { error: linkError } = await supabase
          .from('user_companies')
          .insert({
            user_id: user.user.id,
            company_id: newCompany.id,
            role: 'admin',
          });

        if (linkError) {
          console.error('Error linking user to company:', linkError);
          return;
        }
      }

      await refreshCompanies();
      router.push('/dashboard/companies');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="name">Nome da Empresa*</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Minha Empresa"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="legal_name">Razão Social</Label>
            <Input
              id="legal_name"
              {...register('legal_name')}
              placeholder="Ex: Minha Empresa LTDA"
            />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              {...register('cnpj')}
              placeholder="00.000.000/0000-00"
              onChange={(e) => {
                const formatted = formatCNPJ(e.target.value);
                e.target.value = formatted;
              }}
              maxLength={18}
            />
            {errors.cnpj && (
              <p className="text-sm text-red-600 mt-1">{errors.cnpj.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/companies')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : company ? 'Salvar' : 'Criar Empresa'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}