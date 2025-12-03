'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2 } from 'lucide-react';
import { useCompany } from '@/lib/contexts/company-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateCompanyModal({ open, onOpenChange }: CreateCompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    legal_name: '',
  });
  const supabase = createClient();
  const { refreshCompanies } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Criar a empresa usando a função do banco
      const { data, error } = await supabase
        .rpc('create_company_with_admin', {
          p_name: formData.name,
          p_cnpj: formData.cnpj || null,
          p_legal_name: formData.legal_name || null,
        });

      if (error) {
        throw error;
      }

      // Atualizar o contexto
      await refreshCompanies();

      // Limpar formulário
      setFormData({
        name: '',
        cnpj: '',
        legal_name: '',
      });

      // Modal será fechado automaticamente quando houver empresas
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Erro ao criar empresa. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Criar sua primeira empresa</DialogTitle>
          <DialogDescription>
            Para começar a usar o Finstrava, você precisa criar uma empresa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Minha Empresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_name">Razão Social</Label>
            <Input
              id="legal_name"
              type="text"
              placeholder="Minha Empresa LTDA"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando empresa...
              </>
            ) : (
              'Criar Empresa'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}