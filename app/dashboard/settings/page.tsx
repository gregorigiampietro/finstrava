'use client';

import { useState, useEffect } from 'react';
import { useCompanySettings } from '@/lib/hooks/use-company-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Pencil, Trash2, GripVertical, Save } from 'lucide-react';
import { CancellationReason } from '@/lib/types/settings';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const {
    settings,
    cancellationReasons,
    isLoading,
    updateSettings,
    createCancellationReason,
    updateCancellationReason,
    deleteCancellationReason,
  } = useCompanySettings();
  const { toast } = useToast();

  const [defaultFee, setDefaultFee] = useState<number>(settings?.default_cancellation_fee || 0);
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [includePjInPayroll, setIncludePjInPayroll] = useState<boolean>(settings?.include_pj_in_payroll || false);
  const [isSavingPayrollSettings, setIsSavingPayrollSettings] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<CancellationReason | null>(null);
  const [reasonName, setReasonName] = useState('');
  const [reasonDescription, setReasonDescription] = useState('');
  const [requiresDetails, setRequiresDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualizar valores quando settings carregar
  useEffect(() => {
    if (settings?.default_cancellation_fee !== undefined) {
      setDefaultFee(settings.default_cancellation_fee);
    }
    if (settings?.include_pj_in_payroll !== undefined) {
      setIncludePjInPayroll(settings.include_pj_in_payroll);
    }
  }, [settings]);

  const handleSaveDefaultFee = async () => {
    setIsSavingFee(true);
    try {
      await updateSettings({ default_cancellation_fee: defaultFee });
      toast({ title: 'Sucesso', description: 'Multa padrão atualizada com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar multa padrão', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsSavingFee(false);
    }
  };

  const handleSavePayrollSettings = async () => {
    setIsSavingPayrollSettings(true);
    try {
      await updateSettings({ include_pj_in_payroll: includePjInPayroll });
      toast({ title: 'Sucesso', description: 'Configuração de folha atualizada com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar configuração', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsSavingPayrollSettings(false);
    }
  };

  const openCreateDialog = () => {
    setEditingReason(null);
    setReasonName('');
    setReasonDescription('');
    setRequiresDetails(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (reason: CancellationReason) => {
    setEditingReason(reason);
    setReasonName(reason.name);
    setReasonDescription(reason.description || '');
    setRequiresDetails(reason.requires_details);
    setIsDialogOpen(true);
  };

  const handleSaveReason = async () => {
    if (!reasonName.trim()) {
      toast({ title: 'Erro', description: 'Nome do motivo é obrigatório', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReason) {
        await updateCancellationReason(editingReason.id, {
          name: reasonName,
          description: reasonDescription || undefined,
          requires_details: requiresDetails,
        });
        toast({ title: 'Sucesso', description: 'Motivo atualizado com sucesso!' });
      } else {
        await createCancellationReason({
          name: reasonName,
          description: reasonDescription || undefined,
          requires_details: requiresDetails,
        });
        toast({ title: 'Sucesso', description: 'Motivo criado com sucesso!' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar motivo', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (reason: CancellationReason) => {
    try {
      await updateCancellationReason(reason.id, { is_active: !reason.is_active });
      toast({ title: 'Sucesso', description: reason.is_active ? 'Motivo desativado' : 'Motivo ativado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao alterar status', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleDeleteReason = async (reason: CancellationReason) => {
    if (!confirm(`Tem certeza que deseja excluir "${reason.name}"?`)) return;

    try {
      await deleteCancellationReason(reason.id);
      toast({ title: 'Sucesso', description: 'Motivo excluído com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir motivo', variant: 'destructive' });
      console.error(error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Parâmetros</h1>
          <p className="text-muted-foreground">
            Configure os parâmetros do sistema
          </p>
        </div>
      </div>

      {/* Folha de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Folha de Pagamento</CardTitle>
          <CardDescription>
            Configure os parâmetros da folha de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-1">
              <Label>Incluir PJ/Freelancers na Folha</Label>
              <p className="text-xs text-muted-foreground">
                Se ativado, funcionários com contrato PJ ou Freelancer serão incluídos no cálculo da folha de pagamento
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={includePjInPayroll}
                onCheckedChange={setIncludePjInPayroll}
              />
              <Button onClick={handleSavePayrollSettings} disabled={isSavingPayrollSettings} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {isSavingPayrollSettings ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multa Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Cancelamento de Contratos</CardTitle>
          <CardDescription>
            Configure o valor padrão de multa para cancelamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Multa Padrão por Cancelamento</Label>
              <CurrencyInput
                value={defaultFee}
                onChange={setDefaultFee}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Este valor será preenchido automaticamente ao cancelar um contrato
              </p>
            </div>
            <Button onClick={handleSaveDefaultFee} disabled={isSavingFee}>
              <Save className="h-4 w-4 mr-2" />
              {isSavingFee ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Motivos de Cancelamento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Motivos de Cancelamento</CardTitle>
            <CardDescription>
              Gerencie os motivos disponíveis para cancelamento de contratos
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Motivo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="w-32">Exige Detalhes</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cancellationReasons.map((reason) => (
                <TableRow key={reason.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reason.name}</p>
                      {reason.description && (
                        <p className="text-sm text-muted-foreground">{reason.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {reason.requires_details ? (
                      <Badge variant="secondary">Sim</Badge>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={reason.is_active}
                      onCheckedChange={() => handleToggleActive(reason)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(reason)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReason(reason)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {cancellationReasons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum motivo cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para criar/editar motivo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReason ? 'Editar Motivo' : 'Novo Motivo de Cancelamento'}
            </DialogTitle>
            <DialogDescription>
              {editingReason
                ? 'Altere as informações do motivo'
                : 'Adicione um novo motivo de cancelamento'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason-name">Nome do Motivo *</Label>
              <Input
                id="reason-name"
                value={reasonName}
                onChange={(e) => setReasonName(e.target.value)}
                placeholder="Ex: Problemas financeiros"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason-description">Descrição (opcional)</Label>
              <Textarea
                id="reason-description"
                value={reasonDescription}
                onChange={(e) => setReasonDescription(e.target.value)}
                placeholder="Descrição adicional..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Exige Detalhes Adicionais</Label>
                <p className="text-xs text-muted-foreground">
                  Se ativado, abrirá um campo de texto para o usuário detalhar
                </p>
              </div>
              <Switch
                checked={requiresDetails}
                onCheckedChange={setRequiresDetails}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveReason} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
