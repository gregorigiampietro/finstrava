'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { RevenueByPackage } from '@/lib/hooks/use-dashboard';

interface PackageChartProps {
  data: RevenueByPackage[];
  loading?: boolean;
}

const COLORS = [
  'hsl(152, 60%, 45%)',  // Green
  'hsl(221, 83%, 53%)',  // Blue
  'hsl(262, 83%, 58%)',  // Purple
  'hsl(24, 95%, 53%)',   // Orange
  'hsl(173, 80%, 40%)',  // Teal
  'hsl(340, 82%, 52%)',  // Pink
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function PackageChart({ data, loading }: PackageChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">MRR por Pacote</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Distribuição de receita recorrente</p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.packageName,
    value: item.revenue,
    percentage: item.percentage,
    contracts: item.contractsCount,
    fill: COLORS[index % COLORS.length],
  }));

  const totalMRR = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">MRR por Pacote</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Total: {formatCurrency(totalMRR)}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum contrato ativo</p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    formatCurrency(value),
                    `${props.payload.contracts} contrato(s)`
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => (
                    <span className="text-xs">
                      {value} ({entry.payload.percentage.toFixed(0)}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
