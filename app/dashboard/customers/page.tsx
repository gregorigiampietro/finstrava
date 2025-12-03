'use client';

import { useState } from 'react';
import { useCustomers } from '@/lib/hooks/use-customers';
import { CustomerForm } from '@/components/customers/customer-form';
import { CustomersTable } from '@/components/customers/customers-table';
import { CustomerKPIsCards } from '@/components/customers/customer-kpis-cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Search } from 'lucide-react';
import { Customer, CustomerFormData } from '@/lib/types/customer';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function CustomersPage() {
  const { customers, isLoading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.document && customer.document.includes(searchTerm))
  );

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        toast({
          title: 'Cliente atualizado',
          description: 'O cliente foi atualizado com sucesso.',
        });
      } else {
        await createCustomer(data);
        toast({
          title: 'Cliente criado',
          description: 'O cliente foi criado com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      toast({
        title: 'Erro ao salvar cliente',
        description: 'Ocorreu um erro ao salvar o cliente. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      toast({
        title: 'Cliente excluído',
        description: 'O cliente foi excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir cliente',
        description: 'Ocorreu um erro ao excluir o cliente. Verifique se não há lançamentos vinculados.',
        variant: 'destructive',
      });
    }
  };

  return (
    <CompanyGuard>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar clientes: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os clientes da sua empresa
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* KPIs de Clientes */}
        <CustomerKPIsCards />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando clientes...
          </div>
        ) : (
          <CustomersTable
            customers={filteredCustomers}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCustomer(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Edite os dados do cliente existente' : 'Preencha os dados para criar um novo cliente'}
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingCustomer(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}