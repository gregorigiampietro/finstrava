'use client';

import { useState } from 'react';
import { usePaymentMethods } from '@/lib/hooks/use-payment-methods';
import { PaymentMethodForm } from '@/components/payment-methods/payment-method-form';
import { PaymentMethodsTable } from '@/components/payment-methods/payment-methods-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';
import { PaymentMethod, PaymentMethodFormData } from '@/lib/types/payment-method';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function PaymentMethodsPage() {
  const { paymentMethods, isLoading, error, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } = usePaymentMethods();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (data: PaymentMethodFormData) => {
    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod(editingPaymentMethod.id, data);
        toast({
          title: 'Forma de pagamento atualizada',
          description: 'A forma de pagamento foi atualizada com sucesso.',
        });
      } else {
        await createPaymentMethod(data);
        toast({
          title: 'Forma de pagamento criada',
          description: 'A forma de pagamento foi criada com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingPaymentMethod(null);
    } catch (error) {
      toast({
        title: 'Erro ao salvar forma de pagamento',
        description: 'Ocorreu um erro ao salvar a forma de pagamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMethod(id);
      toast({
        title: 'Forma de pagamento excluída',
        description: 'A forma de pagamento foi excluída com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir forma de pagamento',
        description: 'Ocorreu um erro ao excluir a forma de pagamento. Tente novamente.',
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
              Erro ao carregar formas de pagamento: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Formas de Pagamento</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure as formas de pagamento disponíveis para sua empresa
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Forma de Pagamento
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando formas de pagamento...
          </div>
        ) : (
          <PaymentMethodsTable
            paymentMethods={paymentMethods}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPaymentMethod(null);
        }}>
          <DialogContent aria-describedby="dialog-description">
            <DialogHeader>
              <DialogTitle>
                {editingPaymentMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
              </DialogTitle>
              <p id="dialog-description" className="sr-only">
                {editingPaymentMethod ? 'Edite os dados da forma de pagamento existente' : 'Preencha os dados para criar uma nova forma de pagamento'}
              </p>
            </DialogHeader>
            <PaymentMethodForm
              paymentMethod={editingPaymentMethod || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingPaymentMethod(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}