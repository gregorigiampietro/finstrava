'use client';

import { useState } from 'react';
import { ProductCategoryTree as CategoryTreeType } from '@/lib/types/product-category';
import { ProductCategory } from '@/lib/types/product-category';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCategoryTreeProps {
  categories: CategoryTreeType[];
  onEdit: (category: ProductCategory) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
}

export function ProductCategoryTree({
  categories,
  onEdit,
  onDelete,
  onAddSubcategory,
}: ProductCategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryTreeType | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDeleteClick = (category: CategoryTreeType) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDelete(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const renderCategory = (category: CategoryTreeType, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors",
            level > 0 && "ml-6 border-l-2 border-border pl-4"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: category.color ? `${category.color}20` : 'hsl(var(--primary) / 0.1)' }}
            >
              {isExpanded && hasChildren ? (
                <FolderOpen
                  className="h-4 w-4"
                  style={{ color: category.color || 'hsl(var(--primary))' }}
                />
              ) : (
                <Folder
                  className="h-4 w-4"
                  style={{ color: category.color || 'hsl(var(--primary))' }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{category.name}</span>
                {!category.is_active && (
                  <Badge variant="secondary" className="text-xs">Inativa</Badge>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {category.description}
                </p>
              )}
            </div>

            {hasChildren && (
              <Badge variant="outline" className="text-xs shrink-0">
                {category.children.length} sub
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {level === 0 && (
                <DropdownMenuItem onClick={() => onAddSubcategory(category.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Subcategoria
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(category)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="border rounded-xl bg-card p-2 space-y-1">
        {categories.map(category => renderCategory(category, 0))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria &quot;{categoryToDelete?.name}&quot;?
              {categoryToDelete?.children && categoryToDelete.children.length > 0 && (
                <span className="block mt-2 text-warning font-medium">
                  Atenção: Esta categoria possui {categoryToDelete.children.length} subcategoria(s) que também serão excluídas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
