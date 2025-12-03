'use client';

import { useState } from 'react';
import { Category } from '@/lib/types/category';
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
import { MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown, Tag } from 'lucide-react';
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

interface CategoriesListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoriesList({ categories, onEdit, onDelete }: CategoriesListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const renderCategoryTable = (items: Category[], type: 'income' | 'expense') => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card">
          <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria de {type === 'income' ? 'receita' : 'despesa'} cadastrada
          </p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{category.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {category.description || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={category.is_active ? 'default' : 'secondary'}>
                  {category.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-600">Receitas</h3>
          <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
            {incomeCategories.length} {incomeCategories.length === 1 ? 'categoria' : 'categorias'}
          </Badge>
        </div>
        {renderCategoryTable(incomeCategories, 'income')}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <TrendingDown className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-600">Despesas</h3>
          <Badge variant="outline" className="ml-auto text-red-600 border-red-600">
            {expenseCategories.length} {expenseCategories.length === 1 ? 'categoria' : 'categorias'}
          </Badge>
        </div>
        {renderCategoryTable(expenseCategories, 'expense')}
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