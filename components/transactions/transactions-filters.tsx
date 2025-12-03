"use client"

import { format } from "date-fns"
import { X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { TransactionFilters } from "@/lib/types/transaction"
import { useCategories } from "@/lib/hooks/use-categories"
import { usePaymentMethods } from "@/lib/hooks/use-payment-methods"
import { useCustomers } from "@/lib/hooks/use-customers"

interface TransactionsFiltersProps {
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
}

export function TransactionsFilters({
  filters,
  onFiltersChange,
}: TransactionsFiltersProps) {
  const { categories } = useCategories()
  const { paymentMethods } = usePaymentMethods()
  const { customers } = useCustomers()

  const dateRange: DateRange | undefined = filters.date_from || filters.date_to
    ? {
        from: filters.date_from ? new Date(filters.date_from) : undefined,
        to: filters.date_to ? new Date(filters.date_to) : undefined,
      }
    : undefined

  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    const newFilters = { ...filters }
    if (value === "all" || value === "") {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFiltersChange(newFilters)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const newFilters = { ...filters }

    if (range?.from) {
      newFilters.date_from = format(range.from, "yyyy-MM-dd")
    } else {
      delete newFilters.date_from
    }

    if (range?.to) {
      newFilters.date_to = format(range.to, "yyyy-MM-dd")
    } else {
      delete newFilters.date_to
    }

    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por descrição..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full"
          />
        </div>

        <Select
          value={filters.type || "all"}
          onValueChange={(value) => updateFilter("type", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder="Período"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.category_id || "all"}
          onValueChange={(value) => updateFilter("category_id", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.payment_method_id || "all"}
          onValueChange={(value) => updateFilter("payment_method_id", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {paymentMethods?.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.customer_id || "all"}
          onValueChange={(value) => updateFilter("customer_id", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {customers?.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}