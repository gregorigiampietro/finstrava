'use client';

import { useState } from 'react';
import { usePayrolls } from '@/lib/hooks/use-payrolls';
import { PayrollForm } from '@/components/payroll/payroll-form';
import { PayrollsTable } from '@/components/payroll/payrolls-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Receipt, DollarSign, Users, CalendarCheck } from 'lucide-react';
import { PayrollFormData } from '@/lib/types/payroll';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function PayrollPage() {
  const {
    payrolls,
    isLoading,
    error,
    createPayroll,
    deletePayroll,
    calculatePayroll,
    approvePayroll,
    generateFinancialEntries,
    cancelPayroll,
  } = usePayrolls();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular KPIs
  const totalPayrolls = payrolls.length;
  const paidPayrolls = payrolls.filter(p => p.status === 'paid').length;
  const pendingPayrolls = payrolls.filter(p => ['draft', 'calculated', 'approved'].includes(p.status)).length;
  const totalPaidAmount = payrolls
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.total_net || 0), 0);

  const handleSubmit = async (data: PayrollFormData) => {
    try {
      await createPayroll(data);
      toast({
        title: 'Folha criada',
        description: 'A folha de pagamento foi criada com sucesso.',
      });
      setIsFormOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao criar folha',
        description: errorMessage.includes('unique')
          ? 'Já existe uma folha para este mês de referência.'
          : 'Ocorreu um erro ao criar a folha. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCalculate = async (id: string) => {
    try {
      const count = await calculatePayroll(id);
      toast({
        title: 'Folha calculada',
        description: `${count} funcionário(s) adicionado(s) à folha.`,
      });
    } catch (err) {
      toast({
        title: 'Erro ao calcular folha',
        description: 'Ocorreu um erro ao calcular a folha. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePayroll(id);
      toast({
        title: 'Folha aprovada',
        description: 'A folha foi aprovada com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao aprovar folha',
        description: 'Ocorreu um erro ao aprovar a folha. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateEntries = async (id: string) => {
    try {
      const count = await generateFinancialEntries(id);
      toast({
        title: 'Lançamentos gerados',
        description: `${count} lançamento(s) financeiro(s) criado(s).`,
      });
    } catch (err) {
      toast({
        title: 'Erro ao gerar lançamentos',
        description: 'Ocorreu um erro ao gerar os lançamentos. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelPayroll(id);
      toast({
        title: 'Folha cancelada',
        description: 'A folha foi cancelada com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao cancelar folha',
        description: 'Ocorreu um erro ao cancelar a folha. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePayroll(id);
      toast({
        title: 'Folha excluída',
        description: 'A folha foi excluída com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao excluir folha',
        description: 'Ocorreu um erro ao excluir a folha. Tente novamente.',
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
              Erro ao carregar folhas de pagamento: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Folha de Pagamento
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie as folhas de pagamento da empresa
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Folha
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Receipt className="h-4 w-4" />
              <span className="text-sm">Total de Folhas</span>
            </div>
            <div className="text-2xl font-bold">{totalPayrolls}</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CalendarCheck className="h-4 w-4" />
              <span className="text-sm">Pagas</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{paidPayrolls}</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{pendingPayrolls}</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Pago</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalPaidAmount)}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando folhas de pagamento...
          </div>
        ) : (
          <PayrollsTable
            payrolls={payrolls}
            onCalculate={handleCalculate}
            onApprove={handleApprove}
            onGenerateEntries={handleGenerateEntries}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Folha de Pagamento</DialogTitle>
              <DialogDescription>
                Crie uma nova folha de pagamento para o período desejado
              </DialogDescription>
            </DialogHeader>
            <PayrollForm
              onSubmit={handleSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}
