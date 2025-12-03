'use client';

import { useState, useMemo } from 'react';
import { Employee, employeeStatusLabels, contractTypeLabels } from '@/lib/types/employee';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, Pencil, Trash2, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'name' | 'department' | 'contract_type' | 'base_salary' | 'hire_date' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface EmployeesTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export function EmployeesTable({ employees, onEdit, onDelete }: EmployeesTableProps) {
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

  const sortedEmployees = useMemo(() => {
    if (!employees?.length) return [];

    return [...employees].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'department':
          const deptA = a.department?.name || '';
          const deptB = b.department?.name || '';
          return multiplier * deptA.localeCompare(deptB);
        case 'contract_type':
          return multiplier * a.contract_type.localeCompare(b.contract_type);
        case 'base_salary':
          const salaryA = a.base_salary || 0;
          const salaryB = b.base_salary || 0;
          return multiplier * (salaryA - salaryB);
        case 'hire_date':
          const dateA = a.hire_date || '';
          const dateB = b.hire_date || '';
          return multiplier * dateA.localeCompare(dateB);
        case 'status':
          return multiplier * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [employees, sortConfig]);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    // Adiciona T12:00:00 para evitar problemas de timezone
    // quando a data é interpretada como UTC meia-noite
    const [year, month, day] = date.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'vacation':
        return 'secondary';
      case 'leave':
        return 'outline';
      case 'terminated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const employeeToDelete = employees.find(e => e.id === deleteId);

  if (employees.length === 0) {
    return (
      <div className="border rounded-xl bg-card p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum funcionário cadastrado</h3>
        <p className="text-sm text-muted-foreground">
          Cadastre o primeiro funcionário da empresa
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
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('name')}>
                  Funcionário
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('department')}>
                  Departamento / Cargo
                  {getSortIcon('department')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('contract_type')}>
                  Contrato
                  {getSortIcon('contract_type')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('base_salary')}>
                  Salário
                  {getSortIcon('base_salary')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('hire_date')}>
                  Admissão
                  {getSortIcon('hire_date')}
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
            {sortedEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      {employee.email && (
                        <div className="text-sm text-muted-foreground">
                          {employee.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {employee.department?.name || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {employee.position?.name || '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {contractTypeLabels[employee.contract_type] || employee.contract_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatCurrency(employee.base_salary)}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(employee.hire_date)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(employee.status)}>
                    {employeeStatusLabels[employee.status] || employee.status}
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
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(employee.id)}
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
            <AlertDialogTitle>Excluir funcionário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o funcionário &quot;{employeeToDelete?.name}&quot;?
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
