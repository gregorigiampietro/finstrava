"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { TransactionsFilters } from "@/components/transactions/transactions-filters"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { Card } from "@/components/ui/card"
import { CompanyGuard } from "@/components/company-guard"
import { TransactionFilters } from "@/lib/types/transaction"

export function TransactionsContent() {
  const [isCreating, setIsCreating] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>({})
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
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>

        <Card className="p-6">
          <TransactionsFilters 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </Card>

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