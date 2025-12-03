'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { OverdueAging } from '@/lib/hooks/use-dashboard';
import { cn } from '@/lib/utils';

interface OverdueCardProps {
  data: OverdueAging[];
  totalOverdue: number;
  overdueRate: number;
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function OverdueCard({ data, totalOverdue, overdueRate, loading }: OverdueCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Inadimplência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasOverdue = totalOverdue > 0;

  return (
    <Card className={cn(hasOverdue && 'border-red-200 dark:border-red-900')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <CardTitle className="text-base font-semibold">Inadimplência</CardTitle>
          </div>
          {hasOverdue && (
            <Badge variant="destructive">
              {overdueRate.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasOverdue ? (
          <div className="text-center py-6">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-2">
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>
            </div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Nenhum valor em atraso
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center pb-2 border-b">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalOverdue)}
              </p>
              <p className="text-xs text-muted-foreground">Total em atraso</p>
            </div>

            <div className="space-y-2">
              {data.map((item) => (
                <div
                  key={item.range}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      item.range === '1-30 dias' && 'bg-yellow-500',
                      item.range === '31-60 dias' && 'bg-orange-500',
                      item.range === '60+ dias' && 'bg-red-500',
                    )} />
                    <span className="text-muted-foreground">{item.range}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
