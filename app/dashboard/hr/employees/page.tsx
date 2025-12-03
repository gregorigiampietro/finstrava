'use client';

import { useState } from 'react';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useDepartments } from '@/lib/hooks/use-departments';
import { EmployeeForm } from '@/components/employees/employee-form';
import { EmployeesTable } from '@/components/employees/employees-table';
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
import { Plus, AlertCircle, Search, Users, DollarSign, Building2, Briefcase } from 'lucide-react';
import { Employee, EmployeeFormData, employeeStatusLabels } from '@/lib/types/employee';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function EmployeesPage() {
  const {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getActiveEmployees,
    getTotalSalaries,
  } = useEmployees();

  const { getDepartmentsFlat } = useDepartments();
  const departmentsFlat = getDepartmentsFlat();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  // Filtrar funcionários
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.cpf && employee.cpf.includes(searchTerm)) ||
      (employee.employee_code && employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment =
      filterDepartment === 'all' ||
      (filterDepartment === 'none' && !employee.department_id) ||
      employee.department_id === filterDepartment;

    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const activeEmployees = getActiveEmployees();
  const totalSalaries = getTotalSalaries();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, data);
        toast({
          title: 'Funcionário atualizado',
          description: 'O funcionário foi atualizado com sucesso.',
        });
      } else {
        await createEmployee(data);
        toast({
          title: 'Funcionário criado',
          description: 'O funcionário foi criado com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingEmployee(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao salvar funcionário',
        description: errorMessage.includes('unique')
          ? 'Já existe um funcionário com este CPF.'
          : 'Ocorreu um erro ao salvar o funcionário. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      toast({
        title: 'Funcionário excluído',
        description: 'O funcionário foi excluído com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao excluir funcionário',
        description: 'Ocorreu um erro ao excluir o funcionário. Verifique se não há lançamentos vinculados.',
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
              Erro ao carregar funcionários: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Funcionários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os funcionários da empresa
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total</span>
            </div>
            <div className="text-2xl font-bold">{employees.length}</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Briefcase className="h-4 w-4" />
              <span className="text-sm">Ativos</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{activeEmployees.length}</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Departamentos</span>
            </div>
            <div className="text-2xl font-bold">
              {new Set(employees.map(e => e.department_id).filter(Boolean)).size}
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Folha Mensal</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalSalaries)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email, CPF ou matrícula..."
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(employeeStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando funcionários...
          </div>
        ) : (
          <EmployeesTable
            employees={filteredEmployees}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingEmployee(null);
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee
                  ? 'Edite os dados do funcionário existente'
                  : 'Preencha os dados para cadastrar um novo funcionário'}
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm
              employee={editingEmployee || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingEmployee(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}
