'use client';

import { useState, useEffect } from 'react';
import { useContractAutomation } from '@/lib/hooks/use-contract-automation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Calendar,
  RotateCcw,
  CheckCircle,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ContractAutomationPanel() {
  const {
    processAllAutomation,
    getContractsForDate,
    getContractsExpiring,
    isProcessing,
    error
  } = useContractAutomation();

  const [contractsToday, setContractsToday] = useState<any[]>([]);
  const [contractsExpiring, setContractsExpiring] = useState<any[]>([]);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContractsData();
  }, []);

  const loadContractsData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todayContracts, expiringContracts] = await Promise.all([
        getContractsForDate(today),
        getContractsExpiring(30)
      ]);

      setContractsToday(todayContracts);
      setContractsExpiring(expiringContracts);
    } catch (error) {
      console.error('Erro ao carregar dados dos contratos:', error);
    }
  };

  const handleProcessAutomation = async () => {
    try {
      const results = await processAllAutomation();

      const totalGenerated = results.generatedTransactions.length;
      const totalRenewed = results.processedRenewals.length;
      const totalExpired = results.expiredContracts.length;

      if (totalGenerated > 0 || totalRenewed > 0 || totalExpired > 0) {
        toast({
          title: 'Processamento concluído',
          description: `${totalGenerated} transações, ${totalRenewed} renovações, ${totalExpired} expirações.`,
        });
      } else {
        toast({
          title: 'Tudo em dia',
          description: 'Não há contratos pendentes de processamento.',
        });
      }

      setLastProcessed(new Date());
      await loadContractsData();
    } catch (error) {
      toast({
        title: 'Erro no processamento',
        description: 'Ocorreu um erro ao processar. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalToday = contractsToday.reduce((sum, c) => sum + c.monthly_value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Status da Automação */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automação
            </CardTitle>
            <Badge variant="success-pastel" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Ativa
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Execução automática diária às 6h
          </p>
          <Button
            onClick={handleProcessAutomation}
            disabled={isProcessing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isProcessing ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Processando...' : 'Executar Agora'}
          </Button>
          {lastProcessed && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Último: {format(lastProcessed, 'HH:mm', { locale: ptBR })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cobranças Hoje */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobranças Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {contractsToday.length === 0 ? (
            <div className="text-center py-2">
              <CheckCircle className="h-6 w-6 text-success mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Nenhuma pendente</p>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold">{contractsToday.length}</p>
              <p className="text-xs text-muted-foreground">
                contratos • {formatCurrency(totalToday)}
              </p>
              <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto">
                {contractsToday.slice(0, 3).map((contract) => (
                  <div key={contract.id} className="text-xs flex justify-between">
                    <span className="truncate flex-1">{contract.customer?.name}</span>
                    <span className="font-medium ml-2">{formatCurrency(contract.monthly_value)}</span>
                  </div>
                ))}
                {contractsToday.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{contractsToday.length - 3} mais
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expirando */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expirando em 30 dias
            </CardTitle>
            {contractsExpiring.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contractsExpiring.length === 0 ? (
            <div className="text-center py-2">
              <CheckCircle className="h-6 w-6 text-success mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Nenhum expirando</p>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold">{contractsExpiring.length}</p>
              <p className="text-xs text-muted-foreground">contratos</p>
              <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto">
                {contractsExpiring.slice(0, 3).map((contract) => (
                  <div key={contract.id} className="text-xs flex items-center justify-between">
                    <span className="truncate flex-1">{contract.customer?.name}</span>
                    <Badge
                      variant={contract.automatic_renewal ? "success-pastel" : "warning-pastel"}
                      className="text-[10px] ml-2"
                    >
                      {contract.automatic_renewal ? (
                        <><RotateCcw className="h-2 w-2 mr-0.5" />Auto</>
                      ) : (
                        'Manual'
                      )}
                    </Badge>
                  </div>
                ))}
                {contractsExpiring.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{contractsExpiring.length - 3} mais
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
