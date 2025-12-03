'use client';

import { useState } from 'react';
import { usePositions } from '@/lib/hooks/use-positions';
import { useDepartments } from '@/lib/hooks/use-departments';
import { PositionForm } from '@/components/positions/position-form';
import { PositionsTable } from '@/components/positions/positions-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Search, Briefcase } from 'lucide-react';
import { Position, PositionFormData } from '@/lib/types/position';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function PositionsPage() {
  const {
    positions,
    isLoading,
    error,
    createPosition,
    updatePosition,
    deletePosition
  } = usePositions();

  const { getDepartmentsFlat } = useDepartments();
  const departmentsFlat = getDepartmentsFlat();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const { toast } = useToast();

  // Filtrar cargos
  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment = filterDepartment === 'all' ||
      (filterDepartment === 'none' && !position.department_id) ||
      position.department_id === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  const handleSubmit = async (data: PositionFormData) => {
    try {
      if (editingPosition) {
        await updatePosition(editingPosition.id, data);
        toast({
          title: 'Cargo atualizado',
          description: 'O cargo foi atualizado com sucesso.',
        });
      } else {
        await createPosition(data);
        toast({
          title: 'Cargo criado',
          description: 'O cargo foi criado com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingPosition(null);
    } catch (err) {
      toast({
        title: 'Erro ao salvar cargo',
        description: 'Ocorreu um erro ao salvar o cargo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePosition(id);
      toast({
        title: 'Cargo excluído',
        description: 'O cargo foi excluído com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao excluir cargo',
        description: 'Ocorreu um erro ao excluir o cargo. Verifique se não há funcionários vinculados.',
        variant: 'destructive',
      });
    }
  };

  return (
    <CompanyGuard>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar cargos: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Cargos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os cargos e funções da empresa
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cargo
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">{positions.length}</div>
            <div className="text-sm text-muted-foreground">Total de Cargos</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">
              {positions.filter(p => p.is_active).length}
            </div>
            <div className="text-sm text-muted-foreground">Ativos</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">
              {positions.filter(p => p.department_id).length}
            </div>
            <div className="text-sm text-muted-foreground">Com Departamento</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold">
              {positions.filter(p => p.salary_range_min || p.salary_range_max).length}
            </div>
            <div className="text-sm text-muted-foreground">Com Faixa Salarial</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="none">Sem departamento</SelectItem>
              {departmentsFlat.map(({ department, path }) => (
                <SelectItem key={department.id} value={department.id}>
                  {path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando cargos...
          </div>
        ) : (
          <PositionsTable
            positions={filteredPositions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPosition(null);
        }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPosition ? 'Editar Cargo' : 'Novo Cargo'}
              </DialogTitle>
              <DialogDescription>
                {editingPosition
                  ? 'Edite os dados do cargo existente'
                  : 'Preencha os dados para criar um novo cargo'}
              </DialogDescription>
            </DialogHeader>
            <PositionForm
              position={editingPosition || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingPosition(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}
