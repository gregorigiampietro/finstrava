'use client';

import { useState } from 'react';
import { useDepartments } from '@/lib/hooks/use-departments';
import { DepartmentForm } from '@/components/departments/department-form';
import { DepartmentTree } from '@/components/departments/department-tree';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Building2 } from 'lucide-react';
import { Department, DepartmentFormData } from '@/lib/types/department';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function DepartmentsPage() {
  const {
    departments,
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    buildDepartmentTree
  } = useDepartments();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const { toast } = useToast();

  const departmentTree = buildDepartmentTree();

  const handleSubmit = async (data: DepartmentFormData) => {
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, data);
        toast({
          title: 'Departamento atualizado',
          description: 'O departamento foi atualizado com sucesso.',
        });
      } else {
        await createDepartment(data);
        toast({
          title: 'Departamento criado',
          description: 'O departamento foi criado com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingDepartment(null);
      setParentIdForNew(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao salvar departamento',
        description: errorMessage.includes('unique')
          ? 'Já existe um departamento com este código.'
          : 'Ocorreu um erro ao salvar o departamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setParentIdForNew(null);
    setIsFormOpen(true);
  };

  const handleAddSubdepartment = (parentId: string) => {
    setEditingDepartment(null);
    setParentIdForNew(parentId);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment(id);
      toast({
        title: 'Departamento excluído',
        description: 'O departamento foi excluído com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao excluir departamento',
        description: 'Ocorreu um erro ao excluir o departamento. Verifique se não há funcionários vinculados.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenNewDepartment = () => {
    setEditingDepartment(null);
    setParentIdForNew(null);
    setIsFormOpen(true);
  };

  return (
    <CompanyGuard>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar departamentos: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Departamentos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie a estrutura organizacional da sua empresa
            </p>
          </div>
          <Button onClick={handleOpenNewDepartment}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Departamento
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">{departments.length}</div>
            <div className="text-sm text-muted-foreground">Total de Departamentos</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">
              {departments.filter(d => !d.parent_id).length}
            </div>
            <div className="text-sm text-muted-foreground">Departamentos Raiz</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">
              {departments.filter(d => d.parent_id).length}
            </div>
            <div className="text-sm text-muted-foreground">Subdepartamentos</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">
              {departments.filter(d => d.is_active).length}
            </div>
            <div className="text-sm text-muted-foreground">Ativos</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando departamentos...
          </div>
        ) : (
          <DepartmentTree
            departments={departmentTree}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddSubdepartment={handleAddSubdepartment}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingDepartment(null);
            setParentIdForNew(null);
          }
        }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment
                  ? 'Editar Departamento'
                  : parentIdForNew
                    ? 'Novo Subdepartamento'
                    : 'Novo Departamento'}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment
                  ? 'Edite os dados do departamento existente'
                  : 'Preencha os dados para criar um novo departamento'}
              </DialogDescription>
            </DialogHeader>
            <DepartmentForm
              department={editingDepartment || undefined}
              parentId={parentIdForNew}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingDepartment(null);
                setParentIdForNew(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}
