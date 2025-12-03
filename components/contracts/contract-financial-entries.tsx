'use client';

import { useState } from 'react';
import { useFinancialEntries } from '@/lib/hooks/use-financial-entries';
import { Contract } from '@/lib/types/contract';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash,
  Plus,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContractFinancialEntriesProps {
  contract: Contract;
}

export function ContractFinancialEntries({ contract }: ContractFinancialEntriesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { entries, isLoading, markAsPaid, markAsPending, cancelEntry, getEntryStats } = useFinancialEntries(contract.id);
  const { toast } = useToast();

  const stats = getEntryStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // Usar parseISO para evitar problemas de timezone
    // parseISO interpreta a data como local, não como UTC
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      cancelled: 'outline'
    };
    
    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Vencido',
      cancelled: 'Cancelado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleMarkAsPaid = async (entryId: string) => {
    try {
      await markAsPaid(entryId);
      toast({
        title: 'Lançamento marcado como pago',
        description: 'O status foi atualizado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar lançamento',
        description: 'Ocorreu um erro ao marcar como pago.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPending = async (entryId: string) => {
    try {
      await markAsPending(entryId);
      toast({
        title: 'Lançamento marcado como pendente',
        description: 'O status foi atualizado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar lançamento',
        description: 'Ocorreu um erro ao marcar como pendente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <CardTitle className="text-lg">Lançamentos Financeiros</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {stats.total} total
              </Badge>
              {stats.overdue > 0 && (
                <Badge variant="destructive" className="font-mono">
                  {stats.overdue} vencidos
                </Badge>
              )}
            </div>
            <span className="font-medium">
              {formatCurrency(stats.totalAmount)}
            </span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {/* Resumo de estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(stats.paidAmount)}
                </p>
                <p className="text-xs text-muted-foreground">{stats.paid} lançamentos</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatCurrency(stats.pendingAmount)}
                </p>
                <p className="text-xs text-muted-foreground">{stats.pending} lançamentos</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(stats.overdueAmount)}
                </p>
                <p className="text-xs text-muted-foreground">{stats.overdue} lançamentos</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="text-lg font-bold text-gray-500">
                  {formatCurrency(stats.cancelledAmount)}
                </p>
                <p className="text-xs text-muted-foreground">{stats.cancelled} lançamentos</p>
              </div>
            </div>

            {/* Tabela de lançamentos */}
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Nenhum lançamento encontrado para este contrato.</p>
              </div>
            ) : (
              <div className="border rounded-lg bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(entry.status)}
                            {getStatusBadge(entry.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            entry.status === 'overdue' && 'text-red-600 font-medium'
                          )}>
                            {formatDate(entry.due_date)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>
                          {entry.payment_date && (
                            <div className="text-sm">
                              <p>{formatDate(entry.payment_date)}</p>
                              {entry.payment_amount && entry.payment_amount !== entry.amount && (
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(entry.payment_amount)}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {entry.status === 'pending' || entry.status === 'overdue' ? (
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(entry.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                              ) : null}
                              {entry.status === 'paid' && (
                                <DropdownMenuItem onClick={() => handleMarkAsPending(entry.id)}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Marcar como Pendente
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {entry.status !== 'cancelled' && (
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar
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
            )}

            {/* Botão para adicionar lançamento manual */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Lançamento Manual
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}