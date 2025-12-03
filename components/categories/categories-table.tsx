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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  viewMode?: 'table' | 'tabs';
}

export function CategoriesTable({ 
  categories, 
  onEdit, 
  onDelete,
  viewMode = 'table' 
}: CategoriesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'tabs'>(viewMode);

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const renderTableRow = (category: Category) => (
    <TableRow key={category.id}>
      <TableCell className="w-[250px]">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{category.name}</span>
        </div>
      </TableCell>
      <TableCell className="w-[120px]">
        <Badge 
          variant="outline" 
          className={category.type === 'income' ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}
        >
          {category.type === 'income' ? 'Receita' : 'Despesa'}
        </Badge>
      </TableCell>
      <TableCell className="min-w-[300px]">
        <span className="text-muted-foreground">
          {category.description || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge variant={category.is_active ? 'default' : 'secondary'}>
          {category.is_active ? 'Ativa' : 'Inativa'}
        </Badge>
      </TableCell>
      <TableCell className="w-[70px]">
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
  );

  const renderCategoryTable = (items: Category[], showType = false) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card">
          <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria cadastrada
          </p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nome</TableHead>
              {showType && <TableHead className="w-[120px]">Tipo</TableHead>}
              <TableHead className="min-w-[300px]">Descrição</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(renderTableRow)}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (view === 'tabs') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Total: {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('table')}
          >
            Ver tabela única
          </Button>
        </div>

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receitas ({incomeCategories.length})
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Despesas ({expenseCategories.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="income" className="mt-4">
            {renderCategoryTable(incomeCategories)}
          </TabsContent>
          <TabsContent value="expense" className="mt-4">
            {renderCategoryTable(expenseCategories)}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'} 
          ({incomeCategories.length} {incomeCategories.length === 1 ? 'receita' : 'receitas'}, 
          {' '}{expenseCategories.length} {expenseCategories.length === 1 ? 'despesa' : 'despesas'})
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setView('tabs')}
        >
          Ver por abas
        </Button>
      </div>

      {renderCategoryTable(categories, true)}

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