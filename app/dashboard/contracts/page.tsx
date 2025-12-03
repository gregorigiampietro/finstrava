'use client';

import { useState } from 'react';
import { useContracts } from '@/lib/hooks/use-contracts';
import { ContractsTable } from '@/components/contracts/contracts-table';
import { ContractForm } from '@/components/contracts/contract-form';
import { ContractAutomationPanel } from '@/components/contracts/contract-automation-panel';
import { ContractCancellationDialog } from '@/components/contracts/contract-cancellation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Search, FileStack, DollarSign, Calendar, Users } from 'lucide-react';
import { Contract, ContractFormData } from '@/lib/types/contract';
import { ContractCancellationData } from '@/lib/types/financial-entry';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function ContractsPage() {
  const {
    contracts,
    isLoading,
    error,
    createContract,
    updateContract,
    activateContract,
    pauseContract,
    cancelContractWithFee,
    deleteContract
  } = useContracts();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [cancellingContract, setCancellingContract] = useState<Contract | null>(null);
  const { toast } = useToast();

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (data: ContractFormData) => {
    try {
      if (editingContract) {
        await updateContract(editingContract.id, data);
        toast({
          title: 'Contrato atualizado',
          description: 'O contrato foi atualizado com sucesso.',
        });
      } else {
        await createContract(data);
        toast({
          title: 'Contrato criado',
          description: 'O contrato foi criado com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingContract(null);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContract(id);
      toast({
        title: 'Contrato excluído',
        description: 'O contrato foi excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Ocorreu um erro ao excluir o contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateContract(id);
      toast({
        title: 'Contrato ativado',
        description: 'O contrato começará a gerar faturas automaticamente.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao ativar',
        description: 'Ocorreu um erro ao ativar o contrato.',
        variant: 'destructive',
      });
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseContract(id);
      toast({
        title: 'Contrato pausado',
        description: 'O contrato não gerará novas faturas.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao pausar',
        description: 'Ocorreu um erro ao pausar o contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (contract) {
      setCancellingContract(contract);
    }
  };

  const handleConfirmCancellation = async (data: ContractCancellationData) => {
    try {
      await cancelContractWithFee(data);
      toast({
        title: 'Contrato cancelado',
        description: 'O contrato foi cancelado com sucesso.',
      });
      setCancellingContract(null);
    } catch (error) {
      toast({
        title: 'Erro ao cancelar',
        description: 'Ocorreu um erro ao cancelar o contrato.',
        variant: 'destructive',
      });
    }
  };

  // Calcular estatísticas
  const activeContracts = contracts.filter(c => c.status === 'active');
  const totalMRR = activeContracts.reduce((sum, contract) => sum + contract.monthly_value, 0);
  const contractsExpiringSoon = contracts.filter(c => {
    if (!c.end_date || c.status !== 'active') return false;
    const endDate = new Date(c.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate <= thirtyDaysFromNow;
  });

  // Calcular variação (mock por enquanto)
  const mrrVariation = 8.5;

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
              Erro ao carregar contratos: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contratos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie assinaturas e recorrências
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total"
            value={contracts.length}
            icon={<FileStack className="w-4 h-4" />}
            trendLabel="contratos cadastrados"
          />

          <StatCard
            label="Ativos"
            value={activeContracts.length}
            icon={<Users className="w-4 h-4" />}
            trend={activeContracts.length > 0 ? 100 : 0}
            trendLabel="gerando receita"
          />

          <StatCard
            label="MRR"
            value={formatCurrency(totalMRR)}
            icon={<DollarSign className="w-4 h-4" />}
            trend={mrrVariation}
            trendLabel="vs mês anterior"
          />

          <StatCard
            label="Expirando"
            value={contractsExpiringSoon.length}
            icon={<Calendar className="w-4 h-4" />}
            trend={contractsExpiringSoon.length > 0 ? -contractsExpiringSoon.length : 0}
            trendLabel="próximos 30 dias"
          />
        </div>

        {/* Automação */}
        <ContractAutomationPanel />

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por cliente, título ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando contratos...
          </div>
        ) : (
          <ContractsTable
            contracts={filteredContracts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onActivate={handleActivate}
            onPause={handlePause}
            onCancel={handleCancel}
          />
        )}

        {/* Modal de criação/edição */}
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingContract(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
              </DialogTitle>
              <DialogDescription>
                {editingContract ? 'Edite os dados do contrato' : 'Preencha os dados para criar um novo contrato'}
              </DialogDescription>
            </DialogHeader>
            <ContractForm
              contract={editingContract || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingContract(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de cancelamento */}
        <ContractCancellationDialog
          contract={cancellingContract}
          isOpen={!!cancellingContract}
          onClose={() => setCancellingContract(null)}
          onConfirm={handleConfirmCancellation}
        />
      </div>
    </CompanyGuard>
  );
}
