'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  customer?: { id: string; name: string };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;

    return format(date, "dd MMM", { locale: ptBR });
  } catch {
    return dateString;
  }
};

const getStatusBadge = (status: Transaction['status']) => {
  const config = {
    pending: { label: 'Pendente', variant: 'outline' as const },
    paid: { label: 'Pago', variant: 'default' as const },
    overdue: { label: 'Vencido', variant: 'destructive' as const },
    cancelled: { label: 'Cancelado', variant: 'secondary' as const },
  };

  return (
    <Badge variant={config[status].variant} className="text-xs">
      {config[status].label}
    </Badge>
  );
};

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-4 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Últimas Transações</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Atividade recente</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/transactions">
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Nenhuma transação recente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === 'income';

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                  }`}>
                    {isIncome ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.customer?.name || formatDate(transaction.payment_date || transaction.due_date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-semibold ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
