'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePayrolls } from '@/lib/hooks/use-payrolls';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  AlertCircle,
  Calculator,
  CheckCircle,
  DollarSign,
  XCircle,
  Users,
} from 'lucide-react';
import { Payroll, PayrollItem, payrollStatusLabels } from '@/lib/types/payroll';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';
import Link from 'next/link';

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const payrollId = params.id as string;

  const {
    getPayroll,
    getPayrollItems,
    calculatePayroll,
    approvePayroll,
    generateFinancialEntries,
    cancelPayroll,
  } = usePayrolls();

  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [actionDialog, setActionDialog] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const payrollData = await getPayroll(payrollId);
        setPayroll(payrollData);

        if (payrollData) {
          const itemsData = await getPayrollItems(payrollId);
          setItems(itemsData);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (payrollId) {
      loadData();
    }
  }, [payrollId, getPayroll, getPayrollItems]);

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

  const handleAction = async () => {
    if (!actionDialog || !payroll) return;

    try {
      switch (actionDialog) {
        case 'calculate':
          const calcCount = await calculatePayroll(payrollId);
          toast({
            title: 'Folha calculada',
            description: `${calcCount} funcionário(s) adicionado(s).`,
          });
          break;
        case 'approve':
          await approvePayroll(payrollId);
          toast({
            title: 'Folha aprovada',
            description: 'A folha foi aprovada com sucesso.',
          });
          break;
        case 'generate':
          const genCount = await generateFinancialEntries(payrollId);
          toast({
            title: 'Lançamentos gerados',
            description: `${genCount} lançamento(s) criado(s).`,
          });
          break;
        case 'cancel':
          await cancelPayroll(payrollId);
          toast({
            title: 'Folha cancelada',
            description: 'A folha foi cancelada.',
          });
          break;
      }

      // Recarregar dados
      const payrollData = await getPayroll(payrollId);
      setPayroll(payrollData);
      if (payrollData) {
        const itemsData = await getPayrollItems(payrollId);
        setItems(itemsData);
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar a ação.',
        variant: 'destructive',
      });
    } finally {
      setActionDialog(null);
    }
  };

  if (isLoading) {
    return (
      <CompanyGuard>
        <div className="text-center py-8 text-muted-foreground">
          Carregando folha de pagamento...
        </div>
      </CompanyGuard>
    );
  }

  if (error || !payroll) {
    return (
      <CompanyGuard>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar folha de pagamento: {error?.message || 'Folha não encontrada'}
          </AlertDescription>
        </Alert>
      </CompanyGuard>
    );
  }

  return (
    <CompanyGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/hr/payroll">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold capitalize">
                Folha de {formatMonth(payroll.reference_month)}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant(payroll.status)}>
                  {payrollStatusLabels[payroll.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Pagamento: {formatDate(payroll.payment_date)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {payroll.status === 'draft' && (
              <Button onClick={() => setActionDialog('calculate')}>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular
              </Button>
            )}
            {payroll.status === 'calculated' && (
              <Button onClick={() => setActionDialog('approve')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            )}
            {payroll.status === 'approved' && (
              <Button onClick={() => setActionDialog('generate')}>
                <DollarSign className="mr-2 h-4 w-4" />
                Gerar Lançamentos
              </Button>
            )}
            {['draft', 'calculated'].includes(payroll.status) && (
              <Button variant="outline" onClick={() => setActionDialog('cancel')}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payroll.employee_count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Bruto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(payroll.total_gross)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Deduções</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(payroll.total_deductions)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Líquido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(payroll.total_net)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionários</CardTitle>
            <CardDescription>
              Lista de funcionários incluídos nesta folha de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum funcionário na folha. Clique em &quot;Calcular&quot; para adicionar funcionários.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-right">Salário Base</TableHead>
                      <TableHead className="text-right">Deduções</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.employee?.name || '-'}</div>
                            {item.employee?.cpf && (
                              <div className="text-sm text-muted-foreground">
                                {item.employee.cpf}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.department?.name || '-'}</TableCell>
                        <TableCell>{item.position?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.base_salary)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(item.total_deductions)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(item.net_salary)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {payroll.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{payroll.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Confirmação */}
        <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionDialog === 'calculate' && 'Calcular Folha'}
                {actionDialog === 'approve' && 'Aprovar Folha'}
                {actionDialog === 'generate' && 'Gerar Lançamentos'}
                {actionDialog === 'cancel' && 'Cancelar Folha'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionDialog === 'calculate' &&
                  'Isso irá adicionar todos os funcionários ativos à folha de pagamento.'}
                {actionDialog === 'approve' &&
                  'Após aprovada, a folha não poderá ser alterada.'}
                {actionDialog === 'generate' &&
                  'Isso irá criar lançamentos financeiros para cada funcionário.'}
                {actionDialog === 'cancel' &&
                  'Isso irá cancelar esta folha de pagamento.'}
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
      </div>
    </CompanyGuard>
  );
}
