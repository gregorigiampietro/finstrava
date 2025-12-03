'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/lib/types/product';
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
import { MoreHorizontal, Pencil, Trash2, Package, Wrench, RotateCcw, FolderTree, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'name' | 'type' | 'category' | 'price' | 'unit' | 'is_recurring' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
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

  const sortedProducts = useMemo(() => {
    if (!products?.length) return [];

    return [...products].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'type':
          return multiplier * a.type.localeCompare(b.type);
        case 'category':
          const catA = a.category?.name || '';
          const catB = b.category?.name || '';
          return multiplier * catA.localeCompare(catB);
        case 'price':
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return multiplier * (priceA - priceB);
        case 'unit':
          const unitA = a.unit || '';
          const unitB = b.unit || '';
          return multiplier * unitA.localeCompare(unitB);
        case 'is_recurring':
          const recA = a.is_recurring ? 1 : 0;
          const recB = b.is_recurring ? 1 : 0;
          return multiplier * (recA - recB);
        case 'is_active':
          const activeA = a.is_active ? 1 : 0;
          const activeB = b.is_active ? 1 : 0;
          return multiplier * (activeA - activeB);
        default:
          return 0;
      }
    });
  }, [products, sortConfig]);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getProductIcon = (type: 'product' | 'service') => {
    return type === 'product' ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />;
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-8 bg-card">
        <div className="text-center space-y-3">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhum produto/serviço encontrado</p>
            <p className="text-sm text-muted-foreground">
              Comece criando seus primeiros produtos e serviços.
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
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('type')}>
                  Tipo
                  {getSortIcon('type')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('category')}>
                  Categoria
                  {getSortIcon('category')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('price')}>
                  Preço
                  {getSortIcon('price')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('unit')}>
                  Unidade
                  {getSortIcon('unit')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('is_recurring')}>
                  Recorrente
                  {getSortIcon('is_recurring')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('is_active')}>
                  Status
                  {getSortIcon('is_active')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getProductIcon(product.type)}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {product.type === 'product' ? 'Produto' : 'Serviço'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {product.category ? (
                    <div className="flex items-center gap-1.5">
                      {product.category.color && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: product.category.color }}
                        />
                      )}
                      <span className="text-sm">{product.category.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {formatPrice(product.price)}
                  </span>
                </TableCell>
                <TableCell>
                  {product.unit ? (
                    <span className="text-sm">{product.unit}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.is_recurring ? (
                    <div className="flex items-center gap-1 text-blue-600">
                      <RotateCcw className="h-3 w-3" />
                      <span className="text-xs">Sim</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Não</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
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
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(product.id)}
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
              Tem certeza que deseja excluir este produto/serviço? 
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