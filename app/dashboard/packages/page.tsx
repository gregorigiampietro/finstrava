'use client';

import { useState } from 'react';
import { usePackages } from '@/lib/hooks/use-packages';
import { PackageForm } from '@/components/packages/package-form';
import { PackagesTable } from '@/components/packages/packages-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Search, Boxes, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Package, PackageFormData } from '@/lib/types/package';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function PackagesPage() {
  const { packages, isLoading, error, createPackage, updatePackage, deletePackage } = usePackages();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (data: PackageFormData) => {
    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, data);
        toast({
          title: 'Pacote atualizado',
          description: 'O pacote foi atualizado com sucesso.',
        });
      } else {
        await createPackage(data);
        toast({
          title: 'Pacote criado',
          description: 'O pacote foi criado com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingPackage(null);
    } catch (error) {
      toast({
        title: 'Erro ao salvar pacote',
        description: 'Ocorreu um erro ao salvar o pacote. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePackage(id);
      toast({
        title: 'Pacote excluído',
        description: 'O pacote foi excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir pacote',
        description: 'Ocorreu um erro ao excluir o pacote. Verifique se não há contratos vinculados.',
        variant: 'destructive',
      });
    }
  };

  const activePackages = packages.filter(p => p.is_active);
  const inactivePackages = packages.filter(p => !p.is_active);
  const totalMRR = activePackages.reduce((sum, pkg) => sum + pkg.monthly_price, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <CompanyGuard>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar pacotes: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pacotes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie pacotes de serviços para seus clientes
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pacote
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total"
            value={packages.length}
            icon={<Boxes className="w-4 h-4" />}
            trendLabel="pacotes cadastrados"
          />

          <StatCard
            label="Ativos"
            value={activePackages.length}
            icon={<CheckCircle className="w-4 h-4" />}
            trend={activePackages.length > 0 ? 100 : 0}
            trendLabel="disponíveis"
          />

          <StatCard
            label="Inativos"
            value={inactivePackages.length}
            icon={<XCircle className="w-4 h-4" />}
            trendLabel="desativados"
          />

          <StatCard
            label="Valor Total"
            value={formatCurrency(totalMRR)}
            icon={<DollarSign className="w-4 h-4" />}
            trendLabel="soma dos pacotes ativos"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar pacotes por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando pacotes...
          </div>
        ) : (
          <PackagesTable
            packages={filteredPackages}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Modal */}
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPackage(null);
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
              </DialogTitle>
              <DialogDescription>
                {editingPackage ? 'Edite os dados do pacote' : 'Preencha os dados para criar um novo pacote'}
              </DialogDescription>
            </DialogHeader>
            <PackageForm
              package={editingPackage || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingPackage(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}
