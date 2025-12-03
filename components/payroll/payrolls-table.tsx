'use client';

import { useState, useMemo } from 'react';
import { Payroll, payrollStatusLabels } from '@/lib/types/payroll';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Eye,
  Calculator,
  CheckCircle,
  XCircle,
  Trash2,
  Receipt,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Link from 'next/link';

type SortField = 'reference_month' | 'payment_date' | 'employee_count' | 'total_gross' | 'total_net' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface PayrollsTableProps {
  payrolls: Payroll[];
  onCalculate: (id: string) => void;
  onApprove: (id: string) => void;
  onGenerateEntries: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PayrollsTable({
  payrolls,
  onCalculate,
  onApprove,
  onGenerateEntries,
  onCancel,
  onDelete,
}: PayrollsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'calculate' | 'approve' | 'generate' | 'cancel';
    id: string;
  } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'reference_month', direction: 'desc' });

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const sortedPayrolls = useMemo(() => {
    if (!payrolls?.length) return [];

    return [...payrolls].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'reference_month':
          const refA = a.reference_month || '';
          const refB = b.reference_month || '';
          return multiplier * refA.localeCompare(refB);
        case 'payment_date':
          const payDateA = a.payment_date || '';
          const payDateB = b.payment_date || '';
          return multiplier * payDateA.localeCompare(payDateB);
        case 'employee_count':
          const countA = a.employee_count || 0;
          const countB = b.employee_count || 0;
          return multiplier * (countA - countB);
        case 'total_gross':
          const grossA = a.total_gross || 0;
          const grossB = b.total_gross || 0;
          return multiplier * (grossA - grossB);
        case 'total_net':
          const netA = a.total_net || 0;
          const netB = b.total_net || 0;
          return multiplier * (netA - netB);
        case 'status':
          return multiplier * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [payrolls, sortConfig]);

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    // Cria data no fuso local para evitar D-1 por questão de timezone
    const [year, month, day] = date.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'calculated':
        return 'outline';
      case 'approved':
        return 'default';
      case 'paid':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleAction = () => {
    if (!actionDialog) return;

    switch (actionDialog.type) {
      case 'calculate':
        onCalculate(actionDialog.id);
        break;
      case 'approve':
        onApprove(actionDialog.id);
        break;
      case 'generate':
        onGenerateEntries(actionDialog.id);
        break;
      case 'cancel':
        onCancel(actionDialog.id);
        break;
    }
    setActionDialog(null);
  };

  const payrollToDelete = payrolls.find(p => p.id === deleteId);

  if (payrolls.length === 0) {
    return (
      <div className="border rounded-xl bg-card p-8 text-center">
        <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma folha de pagamento</h3>
        <p className="text-sm text-muted-foreground">
          Crie a primeira folha de pagamento para gerenciar salários
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('reference_month')}>
                  Referência
                  {getSortIcon('reference_month')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('payment_date')}>
                  Data Pagamento
                  {getSortIcon('payment_date')}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button variant="ghost" size="sm" className="h-8" onClick={() => handleSort('employee_count')}>
                  Funcionários
                  {getSortIcon('employee_count')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" className="h-8" onClick={() => handleSort('total_gross')}>
                  Total Bruto
                  {getSortIcon('total_gross')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" className="h-8" onClick={() => handleSort('total_net')}>
                  Total Líquido
                  {getSortIcon('total_net')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('status')}>
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayrolls.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell>
                  <div className="font-medium capitalize">
                    {formatMonth(payroll.reference_month)}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(payroll.payment_date)}
                </TableCell>
                <TableCell className="text-center">
                  {payroll.employee_count || 0}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(payroll.total_gross)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(payroll.total_net)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(payroll.status)}>
                    {payrollStatusLabels[payroll.status] || payroll.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/hr/payroll/${payroll.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>

                      {payroll.status === 'draft' && (
                        <DropdownMenuItem onClick={() => setActionDialog({ type: 'calculate', id: payroll.id })}>
                          <Calculator className="mr-2 h-4 w-4" />
                          Calcular
                        </DropdownMenuItem>
                      )}

                      {payroll.status === 'calculated' && (
                        <DropdownMenuItem onClick={() => setActionDialog({ type: 'approve', id: payroll.id })}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovar
                        </DropdownMenuItem>
                      )}

                      {payroll.status === 'approved' && (
                        <DropdownMenuItem onClick={() => setActionDialog({ type: 'generate', id: payroll.id })}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Gerar Lançamentos
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {['draft', 'calculated'].includes(payroll.status) && (
                        <DropdownMenuItem
                          onClick={() => setActionDialog({ type: 'cancel', id: payroll.id })}
                          className="text-orange-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      )}

                      {payroll.status === 'draft' && (
                        <DropdownMenuItem
                          onClick={() => setDeleteId(payroll.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Ações */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.type === 'calculate' && 'Calcular Folha'}
              {actionDialog?.type === 'approve' && 'Aprovar Folha'}
              {actionDialog?.type === 'generate' && 'Gerar Lançamentos'}
              {actionDialog?.type === 'cancel' && 'Cancelar Folha'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.type === 'calculate' &&
                'Isso irá adicionar todos os funcionários ativos à folha de pagamento. Deseja continuar?'}
              {actionDialog?.type === 'approve' &&
                'Após aprovada, a folha não poderá ser alterada. Deseja aprovar?'}
              {actionDialog?.type === 'generate' &&
                'Isso irá criar lançamentos financeiros para cada funcionário. Deseja gerar?'}
              {actionDialog?.type === 'cancel' &&
                'Isso irá cancelar esta folha de pagamento. Deseja cancelar?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Sim, confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir folha de pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a folha de {formatMonth(payrollToDelete?.reference_month)}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
