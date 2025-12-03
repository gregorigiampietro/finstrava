'use client';

import { useState } from 'react';
import { DepartmentTree as DepartmentTreeType } from '@/lib/types/department';
import { Department } from '@/lib/types/department';
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
  Building2,
  FolderTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepartmentTreeProps {
  departments: DepartmentTreeType[];
  onEdit: (department: Department) => void;
  onDelete: (id: string) => void;
  onAddSubdepartment: (parentId: string) => void;
}

export function DepartmentTree({
  departments,
  onEdit,
  onDelete,
  onAddSubdepartment,
}: DepartmentTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentTreeType | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (depts: DepartmentTreeType[]) => {
      depts.forEach(d => {
        if (d.children.length > 0) {
          allIds.add(d.id);
          collectIds(d.children);
        }
      });
    };
    collectIds(departments);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleDeleteClick = (department: DepartmentTreeType) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (departmentToDelete) {
      onDelete(departmentToDelete.id);
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const renderDepartment = (department: DepartmentTreeType, level: number = 0) => {
    const hasChildren = department.children && department.children.length > 0;
    const isExpanded = expandedIds.has(department.id);

    return (
      <div key={department.id}>
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors",
            level > 0 && "ml-6 border-l-2 border-border pl-4"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(department.id)}
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

            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
              {hasChildren ? (
                <FolderTree className="h-4 w-4 text-primary" />
              ) : (
                <Building2 className="h-4 w-4 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{department.name}</span>
                {department.code && (
                  <Badge variant="outline" className="text-xs">
                    {department.code}
                  </Badge>
                )}
                {!department.is_active && (
                  <Badge variant="secondary" className="text-xs">Inativo</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {department.description && (
                  <span className="truncate">{department.description}</span>
                )}
                {department.budget_monthly && department.budget_monthly > 0 && (
                  <span className="shrink-0">
                    Orçamento: {formatCurrency(department.budget_monthly)}
                  </span>
                )}
              </div>
            </div>

            {hasChildren && (
              <Badge variant="outline" className="text-xs shrink-0">
                {department.children.length} sub
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
              <DropdownMenuItem onClick={() => onAddSubdepartment(department.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Subdepartamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(department)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(department)}
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
            {department.children.map(child => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (departments.length === 0) {
    return (
      <div className="border rounded-xl bg-card p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum departamento cadastrado</h3>
        <p className="text-sm text-muted-foreground">
          Crie o primeiro departamento para organizar sua empresa
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={expandAll}>
          Expandir Todos
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Recolher Todos
        </Button>
      </div>

      <div className="border rounded-xl bg-card p-2 space-y-1">
        {departments.map(department => renderDepartment(department, 0))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir departamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o departamento &quot;{departmentToDelete?.name}&quot;?
              {departmentToDelete?.children && departmentToDelete.children.length > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Atenção: Os subdepartamentos serão movidos para o nível raiz.
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
