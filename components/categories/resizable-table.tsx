'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Category } from '@/lib/types/category';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Tag, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

type SortField = 'name' | 'type' | 'description' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ResizableTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

interface ColumnWidth {
  name: number;
  type: number;
  description: number;
  status: number;
  actions: number;
}

const DEFAULT_WIDTHS: ColumnWidth = {
  name: 250,
  type: 120,
  description: 400,
  status: 100,
  actions: 70,
};

export function ResizableTable({ categories, onEdit, onDelete }: ResizableTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<ColumnWidth>(DEFAULT_WIDTHS);
  const [isResizing, setIsResizing] = useState<keyof ColumnWidth | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const tableRef = useRef<HTMLDivElement>(null);

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

  const sortedCategories = useMemo(() => {
    if (!categories?.length) return [];

    return [...categories].sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'type':
          return multiplier * a.type.localeCompare(b.type);
        case 'description':
          const descA = a.description || '';
          const descB = b.description || '';
          return multiplier * descA.localeCompare(descB);
        case 'is_active':
          const activeA = a.is_active ? 1 : 0;
          const activeB = b.is_active ? 1 : 0;
          return multiplier * (activeA - activeB);
        default:
          return 0;
      }
    });
  }, [categories, sortConfig]);

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const handleMouseDown = (column: keyof ColumnWidth) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(column);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !tableRef.current) return;

      const tableRect = tableRef.current.getBoundingClientRect();
      const x = e.clientX - tableRect.left;
      
      let accumulatedWidth = 0;
      const columns = Object.keys(columnWidths) as (keyof ColumnWidth)[];
      
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col === isResizing) {
          const newWidth = Math.max(50, x - accumulatedWidth);
          setColumnWidths(prev => ({ ...prev, [col]: newWidth }));
          break;
        }
        accumulatedWidth += columnWidths[col];
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, columnWidths]);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Nenhuma categoria cadastrada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
        </p>
      </div>

      <div ref={tableRef} className="border rounded-lg overflow-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr className="divide-x divide-border/20">
              <th
                className="relative text-left p-4 font-medium"
                style={{ width: columnWidths.name }}
              >
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('name')}>
                  Nome
                  {getSortIcon('name')}
                </Button>
                <div
                  className="absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-primary/20 flex items-center justify-center"
                  onMouseDown={handleMouseDown('name')}
                >
                  <div className="h-full w-0.5 bg-border/50" />
                </div>
              </th>
              <th
                className="relative text-left p-4 font-medium"
                style={{ width: columnWidths.type }}
              >
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('type')}>
                  Tipo
                  {getSortIcon('type')}
                </Button>
                <div
                  className="absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-primary/20 flex items-center justify-center"
                  onMouseDown={handleMouseDown('type')}
                >
                  <div className="h-full w-0.5 bg-border/50" />
                </div>
              </th>
              <th
                className="relative text-left p-4 font-medium"
                style={{ width: columnWidths.description }}
              >
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('description')}>
                  Descrição
                  {getSortIcon('description')}
                </Button>
                <div
                  className="absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-primary/20 flex items-center justify-center"
                  onMouseDown={handleMouseDown('description')}
                >
                  <div className="h-full w-0.5 bg-border/50" />
                </div>
              </th>
              <th
                className="relative text-left p-4 font-medium"
                style={{ width: columnWidths.status }}
              >
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('is_active')}>
                  Status
                  {getSortIcon('is_active')}
                </Button>
                <div
                  className="absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-primary/20 flex items-center justify-center"
                  onMouseDown={handleMouseDown('status')}
                >
                  <div className="h-full w-0.5 bg-border/50" />
                </div>
              </th>
              <th
                className="text-left p-4 font-medium"
                style={{ width: columnWidths.actions }}
              >
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category) => (
              <tr key={category.id} className="border-t hover:bg-muted/50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge 
                    variant="outline" 
                    className={category.type === 'income' ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}
                  >
                    {category.type === 'income' ? 'Receita' : 'Despesa'}
                  </Badge>
                </td>
                <td className="p-4">
                  <span className="text-muted-foreground">
                    {category.description || '-'}
                  </span>
                </td>
                <td className="p-4">
                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                    {category.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(category.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
              A categoria será desativada e não aparecerá mais nas listagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}