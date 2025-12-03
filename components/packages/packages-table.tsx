'use client';

import { Package } from '@/lib/types/package';
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
import { MoreHorizontal, Edit, Trash2, Boxes, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useMemo } from 'react';

type SortField = 'name' | 'services_count' | 'monthly_price' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface PackagesTableProps {
  packages: Package[];
  onEdit: (pkg: Package) => void;
  onDelete: (id: string) => void;
}

export function PackagesTable({ packages, onEdit, onDelete }: PackagesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
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

  const sortedPackages = useMemo(() => {
    if (!packages?.length) return [];

    return [...packages].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'services_count':
          const countA = a.package_items?.length || 0;
          const countB = b.package_items?.length || 0;
          return multiplier * (countA - countB);
        case 'monthly_price':
          return multiplier * (a.monthly_price - b.monthly_price);
        case 'is_active':
          const activeA = a.is_active ? 1 : 0;
          const activeB = b.is_active ? 1 : 0;
          return multiplier * (activeA - activeB);
        default:
          return 0;
      }
    });
  }, [packages, sortConfig]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleDeleteClick = (pkg: Package) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (packageToDelete) {
      onDelete(packageToDelete.id);
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl bg-card">
        <Boxes className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhum pacote cadastrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie pacotes para agrupar seus produtos e serviços
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
                  Nome
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('services_count')}>
                  Serviços
                  {getSortIcon('services_count')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('monthly_price')}>
                  Valor Mensal
                  {getSortIcon('monthly_price')}
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
            {sortedPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {pkg.package_items && pkg.package_items.length > 0 ? (
                      <>
                        {pkg.package_items.slice(0, 3).map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.product?.name}
                          </Badge>
                        ))}
                        {pkg.package_items.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{pkg.package_items.length - 3}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhum serviço</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-primary">
                    {formatCurrency(pkg.monthly_price)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={pkg.is_active ? 'success-pastel' : 'secondary'}>
                    {pkg.is_active ? 'Ativo' : 'Inativo'}
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
                      <DropdownMenuItem onClick={() => onEdit(pkg)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(pkg)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pacote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pacote &quot;{packageToDelete?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
