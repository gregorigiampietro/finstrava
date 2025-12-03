"use client"

import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompanyCustomerKPIs } from "@/lib/hooks/use-customer-kpis"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function CustomerKPIsCards() {
  const { kpis, isLoading } = useCompanyCustomerKPIs()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!kpis) {
    return null
  }

  const cards = [
    {
      title: "Total de Clientes",
      value: kpis.total_customers,
      description: `${kpis.leads} leads, ${kpis.active_customers} ativos, ${kpis.churned_customers} churned`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Clientes Ativos",
      value: kpis.active_customers,
      description: `${kpis.activation_rate}% taxa de ativação`,
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Clientes Churned",
      value: kpis.churned_customers,
      description: `${kpis.churn_rate}% taxa de churn`,
      icon: UserX,
      color: "text-red-600",
    },
    {
      title: "Leads",
      value: kpis.leads,
      description: "Ainda não pagaram",
      icon: UserPlus,
      color: "text-yellow-600",
    },
    {
      title: "LTV Total",
      value: formatCurrency(kpis.total_ltv),
      description: `Média: ${formatCurrency(kpis.average_ltv)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      isLarge: true,
    },
    {
      title: "MRR",
      value: formatCurrency(kpis.total_mrr),
      description: `Média por cliente: ${formatCurrency(kpis.average_mrr_per_customer)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      isLarge: true,
    },
    {
      title: "Contratos Ativos",
      value: kpis.total_active_contracts,
      description: "Contratos em vigor",
      icon: FileText,
      color: "text-indigo-600",
    },
    {
      title: "Tempo Médio",
      value: `${kpis.avg_customer_lifetime_months} meses`,
      description: "Lifetime médio dos clientes",
      icon: Calendar,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.isLarge ? 'text-xl' : ''}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
