"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { TransactionsFiltersDialog } from "@/components/transactions/transactions-filters-dialog"
import { TransactionsKpiCards } from "@/components/transactions/transactions-kpi-cards"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { useTransactionFilters } from "@/lib/hooks/use-transaction-filters"
import { CompanyGuard } from "@/components/company-guard"

export function TransactionsContent() {
  const [isCreating, setIsCreating] = useState(false)
  const [filters, setFilters] = useTransactionFilters()
  const { transactions, isLoading, mutate } = useTransactions(filters)

  return (
    <CompanyGuard>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lançamentos</h1>
            <p className="text-muted-foreground">
              Gerencie suas receitas e despesas
            </p>
          </div>
          <div className="flex gap-2">
            <TransactionsFiltersDialog 
              filters={filters}
              onFiltersChange={setFilters}
            />
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        <TransactionsKpiCards transactions={transactions || []} />

        <TransactionsTable 
          transactions={transactions || []} 
          isLoading={isLoading}
          onUpdate={mutate}
        />

        <TransactionForm
          open={isCreating}
          onOpenChange={setIsCreating}
          onSuccess={() => {
            setIsCreating(false)
            mutate()
          }}
        />
      </div>
    </CompanyGuard>
  )
}