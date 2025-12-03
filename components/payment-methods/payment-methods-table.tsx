'use client';

import { useState, useMemo } from 'react';
import { PaymentMethod } from '@/lib/types/payment-method';
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
import { MoreHorizontal, Pencil, Trash2, CreditCard, Banknote, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'name' | 'is_active' | 'max_installments';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface PaymentMethodsTableProps {
  paymentMethods: PaymentMethod[];
  onEdit: (paymentMethod: PaymentMethod) => void;
  onDelete: (id: string) => void;
}

export function PaymentMethodsTable({ paymentMethods, onEdit, onDelete }: PaymentMethodsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });

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

  const sortedPaymentMethods = useMemo(() => {
    if (!paymentMethods?.length) return [];

    return [...paymentMethods].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'is_active':
          const activeA = a.is_active ? 1 : 0;
          const activeB = b.is_active ? 1 : 0;
          return multiplier * (activeA - activeB);
        case 'max_installments':
          const maxA = a.max_installments || 0;
          const maxB = b.max_installments || 0;
          return multiplier * (maxA - maxB);
        default:
          return 0;
      }
    });
  }, [paymentMethods, sortConfig]);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getPaymentMethodIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('cartão') || nameLower.includes('crédito') || nameLower.includes('débito')) {
      return <CreditCard className="h-4 w-4" />;
    }
    return <Banknote className="h-4 w-4" />;
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="border rounded-lg p-8 bg-card">
        <div className="text-center space-y-3">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhuma forma de pagamento encontrada</p>
            <p className="text-sm text-muted-foreground">
              Comece criando suas primeiras formas de pagamento ou use as sugestões padrão.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('name')}>
                  Nome
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('is_active')}>
                  Status
                  {getSortIcon('is_active')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('max_installments')}>
                  Parcelamento
                  {getSortIcon('max_installments')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPaymentMethods.map((paymentMethod) => (
              <TableRow key={paymentMethod.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(paymentMethod.name)}
                    <span className="font-medium">{paymentMethod.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={paymentMethod.is_active ? 'default' : 'secondary'}>
                    {paymentMethod.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {paymentMethod.allows_installments ? (
                    <span className="text-sm">
                      Até {paymentMethod.max_installments}x
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">À vista</span>
                  )}
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
                      <DropdownMenuItem onClick={() => onEdit(paymentMethod)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(paymentMethod.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta forma de pagamento? 
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