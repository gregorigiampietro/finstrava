import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/lib/contexts/company-context';
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from 'date-fns';

export interface DashboardKPIs {
  // Receita
  mrr: number;
  mrrPrevious: number;
  mrrGrowth: number;
  revenue: number;
  revenuePrevious: number;
  revenueGrowth: number;
  receivables: number;

  // Despesas
  expenses: number;
  expensesPrevious: number;
  expensesGrowth: number;
  payables: number;

  // Lucro
  profit: number;
  profitPrevious: number;
  profitGrowth: number;
  profitMargin: number;

  // Clientes
  activeCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  churnRate: number;

  // Contratos
  activeContracts: number;
  newContracts: number;
  cancelledContracts: number;

  // Inadimplência
  overdueAmount: number;
  overdueCount: number;
  overdueRate: number;
}

export interface RevenueByMonth {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  profit: number;
}

export interface RevenueByPackage {
  packageId: string;
  packageName: string;
  revenue: number;
  contractsCount: number;
  percentage: number;
}

export interface OverdueAging {
  range: string;
  amount: number;
  count: number;
}

export interface DashboardAlert {
  id: string;
  type: 'overdue' | 'expiring' | 'pending' | 'churn';
  title: string;
  description: string;
  severity: 'warning' | 'error' | 'info';
  link?: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  revenueByMonth: RevenueByMonth[];
  revenueByPackage: RevenueByPackage[];
  overdueAging: OverdueAging[];
  alerts: DashboardAlert[];
  recentTransactions: any[];
}

export function useDashboard() {
  const { selectedCompany } = useCompany();
  const supabase = createClient();

  const fetcher = async (): Promise<DashboardData> => {
    if (!selectedCompany?.id) {
      return getEmptyDashboardData();
    }

    const companyId = selectedCompany.id;
    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const previousMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
    const previousMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

    // Fetch all data in parallel
    const [
      activeContractsResult,
      currentMonthContractsResult,
      cancelledContractsResult,
      currentIncomeResult,
      previousIncomeResult,
      currentExpenseResult,
      previousExpenseResult,
      pendingReceivablesResult,
      pendingPayablesResult,
      overdueResult,
      customersResult,
      newCustomersResult,
      churnedCustomersResult,
      last6MonthsResult,
      recentTransactionsResult,
    ] = await Promise.all([
      // Contratos ativos
      supabase
        .from('contracts')
        .select('id, monthly_value, package_id, packages(id, name)')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .is('deleted_at', null),

      // Novos contratos este mês
      supabase
        .from('contracts')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .gte('created_at', currentMonthStart)
        .lte('created_at', currentMonthEnd + 'T23:59:59')
        .is('deleted_at', null),

      // Contratos cancelados este mês
      supabase
        .from('contract_history')
        .select('id', { count: 'exact' })
        .eq('change_type', 'cancelled')
        .gte('created_at', currentMonthStart)
        .lte('created_at', currentMonthEnd + 'T23:59:59'),

      // Receita do mês atual (paid)
      supabase
        .from('financial_entries')
        .select('amount')
        .eq('company_id', companyId)
        .eq('type', 'income')
        .eq('status', 'paid')
        .gte('payment_date', currentMonthStart)
        .lte('payment_date', currentMonthEnd),

      // Receita do mês anterior (paid)
      supabase
        .from('financial_entries')
        .select('amount')
        .eq('company_id', companyId)
        .eq('type', 'income')
        .eq('status', 'paid')
        .gte('payment_date', previousMonthStart)
        .lte('payment_date', previousMonthEnd),

      // Despesas do mês atual (paid)
      supabase
        .from('financial_entries')
        .select('amount')
        .eq('company_id', companyId)
        .eq('type', 'expense')
        .eq('status', 'paid')
        .gte('payment_date', currentMonthStart)
        .lte('payment_date', currentMonthEnd),

      // Despesas do mês anterior (paid)
      supabase
        .from('financial_entries')
        .select('amount')
        .eq('company_id', companyId)
        .eq('type', 'expense')
        .eq('status', 'paid')
        .gte('payment_date', previousMonthStart)
        .lte('payment_date', previousMonthEnd),

      // Receitas pendentes
      supabase
        .from('financial_entries')
        .select('amount')
        .eq('company_id', companyId)
        .eq('type', 'income')
        .eq('status', 'pending'),

      // Despesas pendentes
      supabase
        .from('financial_entries')
        .select('amount')
        .eq('company_id', companyId)
        .eq('type', 'expense')
        .eq('status', 'pending'),

      // Receitas vencidas
      supabase
        .from('financial_entries')
        .select('id, amount, due_date, customer:customers(id, name)')
        .eq('company_id', companyId)
        .eq('type', 'income')
        .eq('status', 'overdue'),

      // Clientes ativos
      supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'active')
        .is('deleted_at', null),

      // Novos clientes este mês
      supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .gte('first_payment_at', currentMonthStart)
        .lte('first_payment_at', currentMonthEnd + 'T23:59:59')
        .is('deleted_at', null),

      // Clientes churned este mês
      supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'churned')
        .gte('churned_at', currentMonthStart)
        .lte('churned_at', currentMonthEnd + 'T23:59:59')
        .is('deleted_at', null),

      // Últimos 6 meses de transações para gráfico
      supabase
        .from('financial_entries')
        .select('type, amount, payment_date, status')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('payment_date', format(subMonths(now, 5), 'yyyy-MM-01'))
        .lte('payment_date', currentMonthEnd)
        .order('payment_date', { ascending: true }),

      // Transações recentes
      supabase
        .from('financial_entries')
        .select(`
          id, type, amount, description, due_date, payment_date, status,
          customer:customers(id, name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Calculate KPIs
    const activeContracts = activeContractsResult.data || [];
    const mrr = activeContracts.reduce((sum, c) => sum + (c.monthly_value || 0), 0);

    const revenue = (currentIncomeResult.data || []).reduce((sum, t) => sum + t.amount, 0);
    const revenuePrevious = (previousIncomeResult.data || []).reduce((sum, t) => sum + t.amount, 0);
    const revenueGrowth = revenuePrevious > 0 ? ((revenue - revenuePrevious) / revenuePrevious) * 100 : 0;

    const expenses = (currentExpenseResult.data || []).reduce((sum, t) => sum + t.amount, 0);
    const expensesPrevious = (previousExpenseResult.data || []).reduce((sum, t) => sum + t.amount, 0);
    const expensesGrowth = expensesPrevious > 0 ? ((expenses - expensesPrevious) / expensesPrevious) * 100 : 0;

    const receivables = (pendingReceivablesResult.data || []).reduce((sum, t) => sum + t.amount, 0);
    const payables = (pendingPayablesResult.data || []).reduce((sum, t) => sum + t.amount, 0);

    const profit = revenue - expenses;
    const profitPrevious = revenuePrevious - expensesPrevious;
    const profitGrowth = profitPrevious > 0 ? ((profit - profitPrevious) / profitPrevious) * 100 : 0;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const overdueEntries = overdueResult.data || [];
    const overdueAmount = overdueEntries.reduce((sum, t) => sum + t.amount, 0);
    const overdueCount = overdueEntries.length;
    const overdueRate = revenue > 0 ? (overdueAmount / (revenue + overdueAmount)) * 100 : 0;

    const activeCustomers = customersResult.count || 0;
    const newCustomers = newCustomersResult.count || 0;
    const churnedCustomers = churnedCustomersResult.count || 0;
    const churnRate = activeCustomers > 0 ? (churnedCustomers / (activeCustomers + churnedCustomers)) * 100 : 0;

    // Revenue by month
    const revenueByMonth = calculateRevenueByMonth(last6MonthsResult.data || [], now);

    // Revenue by package
    const revenueByPackage = calculateRevenueByPackage(activeContracts);

    // Overdue aging
    const overdueAging = calculateOverdueAging(overdueEntries, now);

    // Alerts
    const alerts = generateAlerts({
      overdueEntries,
      activeContracts,
      churnedCustomers,
    });

    const kpis: DashboardKPIs = {
      mrr,
      mrrPrevious: mrr, // TODO: calcular MRR do mês anterior
      mrrGrowth: 0,
      revenue,
      revenuePrevious,
      revenueGrowth,
      receivables,
      expenses,
      expensesPrevious,
      expensesGrowth,
      payables,
      profit,
      profitPrevious,
      profitGrowth,
      profitMargin,
      activeCustomers,
      newCustomers,
      churnedCustomers,
      churnRate,
      activeContracts: activeContracts.length,
      newContracts: currentMonthContractsResult.count || 0,
      cancelledContracts: cancelledContractsResult.count || 0,
      overdueAmount,
      overdueCount,
      overdueRate,
    };

    return {
      kpis,
      revenueByMonth,
      revenueByPackage,
      overdueAging,
      alerts,
      recentTransactions: recentTransactionsResult.data || [],
    };
  };

  const key = selectedCompany?.id ? ['dashboard', selectedCompany.id] : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });

  return {
    data: data || getEmptyDashboardData(),
    error,
    isLoading,
    refresh: mutate,
  };
}

function getEmptyDashboardData(): DashboardData {
  return {
    kpis: {
      mrr: 0,
      mrrPrevious: 0,
      mrrGrowth: 0,
      revenue: 0,
      revenuePrevious: 0,
      revenueGrowth: 0,
      receivables: 0,
      expenses: 0,
      expensesPrevious: 0,
      expensesGrowth: 0,
      payables: 0,
      profit: 0,
      profitPrevious: 0,
      profitGrowth: 0,
      profitMargin: 0,
      activeCustomers: 0,
      newCustomers: 0,
      churnedCustomers: 0,
      churnRate: 0,
      activeContracts: 0,
      newContracts: 0,
      cancelledContracts: 0,
      overdueAmount: 0,
      overdueCount: 0,
      overdueRate: 0,
    },
    revenueByMonth: [],
    revenueByPackage: [],
    overdueAging: [],
    alerts: [],
    recentTransactions: [],
  };
}

function calculateRevenueByMonth(transactions: any[], now: Date): RevenueByMonth[] {
  const months: RevenueByMonth[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, 'yyyy-MM');
    const monthLabel = format(monthDate, 'MMM', { locale: undefined });

    const monthTransactions = transactions.filter(t =>
      t.payment_date?.startsWith(monthKey)
    );

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    months.push({
      month: monthKey,
      monthLabel,
      income,
      expense,
      profit: income - expense,
    });
  }

  return months;
}

function calculateRevenueByPackage(contracts: any[]): RevenueByPackage[] {
  const packageMap = new Map<string, { name: string; revenue: number; count: number }>();
  let totalRevenue = 0;

  contracts.forEach(contract => {
    const packageId = contract.package_id || 'sem-pacote';
    const packageName = contract.packages?.name || 'Sem Pacote';
    const revenue = contract.monthly_value || 0;

    totalRevenue += revenue;

    if (packageMap.has(packageId)) {
      const existing = packageMap.get(packageId)!;
      existing.revenue += revenue;
      existing.count += 1;
    } else {
      packageMap.set(packageId, { name: packageName, revenue, count: 1 });
    }
  });

  return Array.from(packageMap.entries())
    .map(([packageId, data]) => ({
      packageId,
      packageName: data.name,
      revenue: data.revenue,
      contractsCount: data.count,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function calculateOverdueAging(overdueEntries: any[], now: Date): OverdueAging[] {
  const aging = {
    '1-30': { amount: 0, count: 0 },
    '31-60': { amount: 0, count: 0 },
    '60+': { amount: 0, count: 0 },
  };

  overdueEntries.forEach(entry => {
    const dueDate = new Date(entry.due_date);
    const daysDiff = differenceInDays(now, dueDate);

    if (daysDiff <= 30) {
      aging['1-30'].amount += entry.amount;
      aging['1-30'].count += 1;
    } else if (daysDiff <= 60) {
      aging['31-60'].amount += entry.amount;
      aging['31-60'].count += 1;
    } else {
      aging['60+'].amount += entry.amount;
      aging['60+'].count += 1;
    }
  });

  return [
    { range: '1-30 dias', amount: aging['1-30'].amount, count: aging['1-30'].count },
    { range: '31-60 dias', amount: aging['31-60'].amount, count: aging['31-60'].count },
    { range: '60+ dias', amount: aging['60+'].amount, count: aging['60+'].count },
  ];
}

function generateAlerts(data: {
  overdueEntries: any[];
  activeContracts: any[];
  churnedCustomers: number;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  // Alertas de inadimplência
  const overdue30Days = data.overdueEntries.filter(e => {
    const daysDiff = differenceInDays(new Date(), new Date(e.due_date));
    return daysDiff > 30;
  });

  if (overdue30Days.length > 0) {
    alerts.push({
      id: 'overdue-30',
      type: 'overdue',
      title: `${overdue30Days.length} cliente(s) com pagamento vencido há mais de 30 dias`,
      description: `Total de R$ ${overdue30Days.reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso`,
      severity: 'error',
      link: '/dashboard/transactions?status=overdue',
    });
  }

  // Alertas de churn
  if (data.churnedCustomers > 0) {
    alerts.push({
      id: 'churn',
      type: 'churn',
      title: `${data.churnedCustomers} cliente(s) cancelaram este mês`,
      description: 'Analise os motivos de cancelamento para melhorar a retenção',
      severity: 'warning',
      link: '/dashboard/customers?status=churned',
    });
  }

  // Alertas de faturas pendentes esta semana
  const pendingThisWeek = data.overdueEntries.filter(e => {
    const daysDiff = differenceInDays(new Date(), new Date(e.due_date));
    return daysDiff >= 0 && daysDiff <= 7;
  });

  if (pendingThisWeek.length > 0) {
    alerts.push({
      id: 'pending-week',
      type: 'pending',
      title: `${pendingThisWeek.length} fatura(s) vencendo esta semana`,
      description: 'Acompanhe os pagamentos para evitar atrasos',
      severity: 'info',
      link: '/dashboard/transactions?status=pending',
    });
  }

  return alerts;
}
