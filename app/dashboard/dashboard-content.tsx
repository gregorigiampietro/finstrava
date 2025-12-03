'use client';

import { useCompany } from '@/lib/contexts/company-context';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  KPICard,
  RevenueChart,
  PackageChart,
  OverdueCard,
  AlertsCard,
  RecentTransactions,
} from '@/components/dashboard';
import {
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  Building2,
  CreditCard,
  Repeat,
  UserMinus,
} from 'lucide-react';

interface DashboardContentProps {
  user: {
    id: string;
    email?: string;
    name?: string;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function DashboardContent({ user }: DashboardContentProps) {
  const { selectedCompany, companies, isLoading: companyLoading } = useCompany();
  const { data, isLoading: dashboardLoading, error } = useDashboard();

  const isLoading = companyLoading || dashboardLoading;
  const { kpis, revenueByMonth, revenueByPackage, overdueAging, alerts, recentTransactions } = data;

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!selectedCompany && companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md mx-auto text-center p-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Bem-vindo ao Finstrava</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Para começar, crie sua primeira empresa no menu lateral.
          </p>
          <Badge variant="primary-pastel">Comece agora</Badge>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá, {user.name || user.email?.split('@')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumo financeiro de {selectedCompany?.name}
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="MRR"
          value={formatCurrency(kpis.mrr)}
          change={kpis.mrrGrowth}
          changeLabel="vs mês anterior"
          icon={<Repeat className="w-5 h-5" />}
          loading={isLoading}
        />

        <KPICard
          title="Faturamento"
          value={formatCurrency(kpis.revenue)}
          change={kpis.revenueGrowth}
          changeLabel="vs mês anterior"
          icon={<DollarSign className="w-5 h-5" />}
          loading={isLoading}
        />

        <KPICard
          title="Clientes Ativos"
          value={kpis.activeCustomers}
          change={kpis.newCustomers > 0 ? (kpis.newCustomers / (kpis.activeCustomers || 1)) * 100 : 0}
          changeLabel={`+${kpis.newCustomers} novos`}
          icon={<Users className="w-5 h-5" />}
          loading={isLoading}
        />

        <KPICard
          title="Lucro"
          value={formatCurrency(kpis.profit)}
          change={kpis.profitGrowth}
          changeLabel={`Margem: ${kpis.profitMargin.toFixed(0)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant={kpis.profit >= 0 ? 'success' : 'danger'}
          loading={isLoading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Contratos Ativos"
          value={kpis.activeContracts}
          changeLabel={`+${kpis.newContracts} este mês`}
          icon={<FileText className="w-5 h-5" />}
          size="sm"
          loading={isLoading}
        />

        <KPICard
          title="Despesas"
          value={formatCurrency(kpis.expenses)}
          change={kpis.expensesGrowth}
          changeLabel="vs mês anterior"
          icon={<CreditCard className="w-5 h-5" />}
          size="sm"
          variant={kpis.expensesGrowth > 10 ? 'warning' : 'default'}
          loading={isLoading}
        />

        <KPICard
          title="A Receber"
          value={formatCurrency(kpis.receivables)}
          changeLabel="pendentes"
          icon={<DollarSign className="w-5 h-5" />}
          size="sm"
          loading={isLoading}
        />

        <KPICard
          title="Churn"
          value={`${kpis.churnRate.toFixed(1)}%`}
          changeLabel={`${kpis.churnedCustomers} cancelamentos`}
          icon={<UserMinus className="w-5 h-5" />}
          size="sm"
          variant={kpis.churnRate > 5 ? 'danger' : kpis.churnRate > 2 ? 'warning' : 'default'}
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <RevenueChart
          data={revenueByMonth}
          loading={isLoading}
        />

        <RecentTransactions
          transactions={recentTransactions}
          loading={isLoading}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <PackageChart
          data={revenueByPackage}
          loading={isLoading}
        />

        <OverdueCard
          data={overdueAging}
          totalOverdue={kpis.overdueAmount}
          overdueRate={kpis.overdueRate}
          loading={isLoading}
        />

        <AlertsCard
          alerts={alerts}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
