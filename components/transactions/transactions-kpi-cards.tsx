'use client';

import { Transaction } from '@/lib/types/transaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface TransactionsKpiCardsProps {
  transactions: Transaction[];
}

export function TransactionsKpiCards({ transactions }: TransactionsKpiCardsProps) {
  // Calcular métricas
  const totals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.totalIncome += transaction.amount;
      if (transaction.status === 'paid') {
        acc.paidIncome += transaction.amount;
      }
    } else {
      acc.totalExpense += transaction.amount;
      if (transaction.status === 'paid') {
        acc.paidExpense += transaction.amount;
      }
    }

    // Contar por status
    switch (transaction.status) {
      case 'pending':
        acc.pending++;
        break;
      case 'paid':
        acc.paid++;
        break;
      case 'overdue':
        acc.overdue++;
        break;
      case 'cancelled':
        acc.cancelled++;
        break;
    }

    return acc;
  }, {
    totalIncome: 0,
    totalExpense: 0,
    paidIncome: 0,
    paidExpense: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
  });

  const balance = totals.paidIncome - totals.paidExpense;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Receitas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Recebido: {formatCurrency(totals.paidIncome)}
          </p>
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totals.totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pago: {formatCurrency(totals.paidExpense)}
          </p>
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo (Realizado)</CardTitle>
          <div className={balance >= 0 ? "text-green-600" : "text-red-600"}>
            {balance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Receitas - Despesas pagas
          </p>
        </CardContent>
      </Card>

      {/* Status dos Lançamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                Pendentes
              </span>
              <span className="font-medium">{totals.pending}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Pagos
              </span>
              <span className="font-medium">{totals.paid}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-red-600" />
                Vencidos
              </span>
              <span className="font-medium">{totals.overdue}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-gray-500" />
                Cancelados
              </span>
              <span className="font-medium">{totals.cancelled}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}