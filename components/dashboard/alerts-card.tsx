'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, ChevronRight, Bell } from 'lucide-react';
import { DashboardAlert } from '@/lib/hooks/use-dashboard';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AlertsCardProps {
  alerts: DashboardAlert[];
  loading?: boolean;
}

export function AlertsCard({ alerts, loading }: AlertsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Alertas e Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityStyles = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'warning':
        return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
      default:
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Alertas e Ações</CardTitle>
          </div>
          {alerts.length > 0 && (
            <Badge variant="outline">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-2">
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum alerta no momento
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tudo está em dia!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border-l-4 transition-colors',
                  getSeverityStyles(alert.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {alert.description}
                    </p>
                  </div>
                  {alert.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-8 w-8 p-0"
                      asChild
                    >
                      <Link href={alert.link}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
