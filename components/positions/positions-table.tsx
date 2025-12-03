'use client';

import { useState, useMemo } from 'react';
import { Position } from '@/lib/types/position';
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
import { MoreHorizontal, Pencil, Trash2, Briefcase, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'name' | 'department' | 'salary_range' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface PositionsTableProps {
  positions: Position[];
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
}

export function PositionsTable({ positions, onEdit, onDelete }: PositionsTableProps) {
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

  const sortedPositions = useMemo(() => {
    if (!positions?.length) return [];

    return [...positions].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'department':
          const deptA = a.department?.name || '';
          const deptB = b.department?.name || '';
          return multiplier * deptA.localeCompare(deptB);
        case 'salary_range':
          const salaryA = a.salary_range_min || 0;
          const salaryB = b.salary_range_min || 0;
          return multiplier * (salaryA - salaryB);
        case 'is_active':
          const activeA = a.is_active ? 1 : 0;
          const activeB = b.is_active ? 1 : 0;
          return multiplier * (activeA - activeB);
        default:
          return 0;
      }
    });
  }, [positions, sortConfig]);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const positionToDelete = positions.find(p => p.id === deleteId);

  if (positions.length === 0) {
    return (
      <div className="border rounded-xl bg-card p-8 text-center">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum cargo cadastrado</h3>
        <p className="text-sm text-muted-foreground">
          Crie o primeiro cargo para definir a estrutura de cargos da empresa
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
                  Cargo
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('department')}>
                  Departamento
                  {getSortIcon('department')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('salary_range')}>
                  Faixa Salarial
                  {getSortIcon('salary_range')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('is_active')}>
                  Status
                  {getSortIcon('is_active')}
                </Button>
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPositions.map((position) => (
              <TableRow key={position.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{position.name}</div>
                    {position.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {position.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {position.department?.name || (
                    <span className="text-muted-foreground">Geral</span>
                  )}
                </TableCell>
                <TableCell>
                  {position.salary_range_min || position.salary_range_max ? (
                    <div className="text-sm">
                      {formatCurrency(position.salary_range_min)} - {formatCurrency(position.salary_range_max)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={position.is_active ? 'default' : 'secondary'}>
                    {position.is_active ? 'Ativo' : 'Inativo'}
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
                      <DropdownMenuItem onClick={() => onEdit(position)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(position.id)}
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
            <AlertDialogTitle>Excluir cargo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cargo &quot;{positionToDelete?.name}&quot;?
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
