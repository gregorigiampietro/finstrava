'use client';

import React, { useState, useMemo } from 'react';
import { Contract } from '@/lib/types/contract';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
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
import { MoreHorizontal, Pencil, Trash2, Play, Pause, X, FileText, Calendar, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractFinancialEntries } from './contract-financial-entries';

type SortField = 'customer' | 'title' | 'monthly_value' | 'billing_type' | 'next_billing_date' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ContractsTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  onPause: (id: string) => void;
  onCancel: (id: string) => void;
}

export function ContractsTable({ contracts, onEdit, onDelete, onActivate, onPause, onCancel }: ContractsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'pause' | 'cancel' | null>(null);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'customer', direction: 'asc' });

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

  const sortedContracts = useMemo(() => {
    if (!contracts?.length) return [];

    return [...contracts].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'customer':
          const customerA = a.customer?.name || '';
          const customerB = b.customer?.name || '';
          return multiplier * customerA.localeCompare(customerB);
        case 'title':
          return multiplier * a.title.localeCompare(b.title);
        case 'monthly_value':
          return multiplier * (a.monthly_value - b.monthly_value);
        case 'billing_type':
          return multiplier * a.billing_type.localeCompare(b.billing_type);
        case 'next_billing_date':
          const dateA = a.next_billing_date || '';
          const dateB = b.next_billing_date || '';
          return multiplier * dateA.localeCompare(dateB);
        case 'status':
          return multiplier * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [contracts, sortConfig]);

  const toggleExpanded = (contractId: string) => {
    const newExpanded = new Set(expandedContracts);
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId);
    } else {
      newExpanded.add(contractId);
    }
    setExpandedContracts(newExpanded);
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const handleAction = () => {
    if (actionId && actionType) {
      switch (actionType) {
        case 'activate':
          onActivate(actionId);
          break;
        case 'pause':
          onPause(actionId);
          break;
        case 'cancel':
          onCancel(actionId);
          break;
      }
      setActionId(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: Contract['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Rascunho' },
      active: { variant: 'default' as const, label: 'Ativo' },
      paused: { variant: 'outline' as const, label: 'Pausado' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelado' },
      expired: { variant: 'secondary' as const, label: 'Expirado' },
    };
    
    return (
      <Badge variant={variants[status].variant}>
        {variants[status].label}
      </Badge>
    );
  };

  const getBillingTypeLabel = (billingType: Contract['billing_type']) => {
    const labels = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
    };
    return labels[billingType];
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (contracts.length === 0) {
    return (
      <div className="border rounded-lg p-8 bg-card">
        <div className="text-center space-y-3">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhum contrato encontrado</p>
            <p className="text-sm text-muted-foreground">
              Comece criando seus primeiros contratos de assinatura.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getActionLabel = () => {
    switch (actionType) {
      case 'activate': return 'Ativar';
      case 'pause': return 'Pausar';
      case 'cancel': return 'Cancelar';
      default: return 'Confirmar';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'activate': return 'Este contrato começará a gerar faturas automaticamente.';
      case 'pause': return 'Este contrato será pausado e não gerará novas faturas.';
      case 'cancel': return 'Este contrato será cancelado permanentemente.';
      default: return '';
    }
  };

  return (
    <>
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('customer')}>
                  Cliente
                  {getSortIcon('customer')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('title')}>
                  Título
                  {getSortIcon('title')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('monthly_value')}>
                  Valor
                  {getSortIcon('monthly_value')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('billing_type')}>
                  Tipo
                  {getSortIcon('billing_type')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('next_billing_date')}>
                  Próxima Cobrança
                  {getSortIcon('next_billing_date')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('status')}>
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContracts.map((contract) => (
              <React.Fragment key={contract.id}>
                <TableRow className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(contract.id)}
                    >
                      {expandedContracts.has(contract.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell onClick={() => toggleExpanded(contract.id)}>
                  <div>
                    <p className="font-medium">{contract.customer?.name}</p>
                    {contract.customer?.email && (
                      <p className="text-sm text-muted-foreground">{contract.customer.email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={() => toggleExpanded(contract.id)}>
                  <div>
                    <p className="font-medium">{contract.title}</p>
                    {contract.contract_number && (
                      <p className="text-xs text-muted-foreground">#{contract.contract_number}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={() => toggleExpanded(contract.id)}>
                  <span className="font-mono text-sm font-medium">
                    {formatCurrency(contract.monthly_value)}
                  </span>
                </TableCell>
                <TableCell onClick={() => toggleExpanded(contract.id)}>
                  <Badge variant="outline">
                    {getBillingTypeLabel(contract.billing_type)}
                  </Badge>
                </TableCell>
                <TableCell onClick={() => toggleExpanded(contract.id)}>
                  {contract.next_billing_date ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {formatDate(contract.next_billing_date)}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell onClick={() => toggleExpanded(contract.id)}>
                  {getStatusBadge(contract.status)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(contract)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      
                      {contract.status === 'draft' && (
                        <DropdownMenuItem onClick={() => {
                          setActionId(contract.id);
                          setActionType('activate');
                        }}>
                          <Play className="mr-2 h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      )}
                      
                      {contract.status === 'active' && (
                        <DropdownMenuItem onClick={() => {
                          setActionId(contract.id);
                          setActionType('pause');
                        }}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </DropdownMenuItem>
                      )}
                      
                      {contract.status === 'paused' && (
                        <DropdownMenuItem onClick={() => {
                          setActionId(contract.id);
                          setActionType('activate');
                        }}>
                          <Play className="mr-2 h-4 w-4" />
                          Reativar
                        </DropdownMenuItem>
                      )}
                      
                      {(contract.status === 'active' || contract.status === 'paused') && (
                        <DropdownMenuItem onClick={() => {
                          setActionId(contract.id);
                          setActionType('cancel');
                        }}>
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(contract.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                </TableRow>
                {expandedContracts.has(contract.id) && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <div className="p-4 bg-muted/30">
                        <ContractFinancialEntries contract={contract} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmação para ações */}
      <AlertDialog open={!!actionId} onOpenChange={() => {
        setActionId(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {getActionLabel()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}