'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RevenueByMonth } from '@/lib/hooks/use-dashboard';

interface RevenueChartProps {
  data: RevenueByMonth[];
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
};

const formatTooltipValue = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <Card className="lg:col-span-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Receitas vs Despesas</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate growth
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const growth = previousMonth?.income > 0
    ? ((currentMonth?.income - previousMonth?.income) / previousMonth?.income) * 100
    : 0;

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Receitas vs Despesas</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
          </div>
          {growth !== 0 && (
            <Badge variant={growth > 0 ? 'success-pastel' : 'destructive'}>
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatTooltipValue(value),
                    name === 'income' ? 'Receitas' : 'Despesas'
                  ]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => value === 'income' ? 'Receitas' : 'Despesas'}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill="hsl(152, 60%, 45%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill="hsl(0, 72%, 55%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
