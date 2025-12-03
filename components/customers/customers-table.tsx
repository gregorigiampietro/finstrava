'use client';

import { useState, useMemo } from 'react';
import { Customer } from '@/lib/types/customer';
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
import { MoreHorizontal, Pencil, Trash2, User, Building, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDocument, formatPhone } from '@/lib/utils/document';

type SortField = 'name' | 'document' | 'phone' | 'city' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface CustomersTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export function CustomersTable({ customers, onEdit, onDelete }: CustomersTableProps) {
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

  const sortedCustomers = useMemo(() => {
    if (!customers?.length) return [];

    return [...customers].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'document':
          const docA = a.document || '';
          const docB = b.document || '';
          return multiplier * docA.localeCompare(docB);
        case 'phone':
          const phoneA = a.phone || '';
          const phoneB = b.phone || '';
          return multiplier * phoneA.localeCompare(phoneB);
        case 'city':
          const cityA = a.city || '';
          const cityB = b.city || '';
          return multiplier * cityA.localeCompare(cityB);
        case 'status':
          const statusA = a.status || '';
          const statusB = b.status || '';
          return multiplier * statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });
  }, [customers, sortConfig]);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getDocumentIcon = (type?: 'cpf' | 'cnpj') => {
    return type === 'cnpj' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  if (customers.length === 0) {
    return (
      <div className="border rounded-lg p-8 bg-card">
        <div className="text-center space-y-3">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm text-muted-foreground">
              Comece cadastrando seu primeiro cliente.
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('name')}
                >
                  Nome
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('document')}
                >
                  Documento
                  {getSortIcon('document')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('phone')}
                >
                  Contato
                  {getSortIcon('phone')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('city')}
                >
                  Cidade/UF
                  {getSortIcon('city')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getDocumentIcon(customer.document_type)}
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.email && (
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {customer.document && customer.document_type ? (
                    <span className="text-sm font-mono">
                      {formatDocument(customer.document, customer.document_type)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.phone ? (
                    <span className="text-sm">{formatPhone(customer.phone)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.city && customer.state ? (
                    <span className="text-sm">{customer.city}/{customer.state}</span>
                  ) : customer.city ? (
                    <span className="text-sm">{customer.city}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.status === 'active' ? (
                    <Badge variant="default" className="bg-green-600">
                      Ativo
                    </Badge>
                  ) : customer.status === 'churned' ? (
                    <Badge variant="destructive">
                      Churned
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Lead
                    </Badge>
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
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(customer.id)}
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
              Tem certeza que deseja excluir este cliente? 
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