"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Filter, X, Check, Calendar } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { TransactionFilters } from "@/lib/types/transaction"
import { useCategories } from "@/lib/hooks/use-categories"
import { usePaymentMethods } from "@/lib/hooks/use-payment-methods"
import { useCustomers } from "@/lib/hooks/use-customers"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface TransactionsFiltersDialogProps {
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
}

interface MultiSelectOption {
  value: string
  label: string
}

const statusOptions: MultiSelectOption[] = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "overdue", label: "Vencido" },
  { value: "cancelled", label: "Cancelado" },
]

const typeOptions: MultiSelectOption[] = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" },
]

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : selected.length === options.length
              ? "Todos"
              : `${selected.length} selecionado${selected.length > 1 ? 's' : ''}`}
          </span>
          <Badge variant="secondary" className="ml-2">
            {selected.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <div className="p-2">
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium">{placeholder}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(selected.length === options.length ? [] : options.map(o => o.value))}
              className="h-auto p-1 text-xs"
            >
              {selected.length === options.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
          </div>
          <Separator className="mb-2" />
          <ScrollArea className="h-[200px]">
            {options.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                onClick={() => toggleOption(option.value)}
              >
                <div className={cn(
                  "h-4 w-4 border rounded flex items-center justify-center",
                  selected.includes(option.value) ? "bg-primary border-primary" : "border-muted-foreground"
                )}>
                  {selected.includes(option.value) && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <label className="text-sm font-medium cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TransactionsFiltersDialog({
  filters,
  onFiltersChange,
}: TransactionsFiltersDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<TransactionFilters>(filters)
  const { categories } = useCategories()
  const { paymentMethods } = usePaymentMethods()
  const { customers } = useCustomers()

  // Parse arrays from filters
  const selectedStatuses = tempFilters.status ? tempFilters.status.split(',') : []
  const selectedTypes = tempFilters.type ? tempFilters.type.split(',') : []
  const selectedCategories = tempFilters.category_ids ? tempFilters.category_ids.split(',') : []
  const selectedPaymentMethods = tempFilters.payment_method_ids ? tempFilters.payment_method_ids.split(',') : []
  const selectedCustomers = tempFilters.customer_ids ? tempFilters.customer_ids.split(',') : []

  const dateRange: DateRange | undefined = tempFilters.date_from || tempFilters.date_to
    ? {
        from: tempFilters.date_from ? new Date(tempFilters.date_from) : undefined,
        to: tempFilters.date_to ? new Date(tempFilters.date_to) : undefined,
      }
    : undefined

  useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleApply = () => {
    const finalFilters: TransactionFilters = {}
    
    if (tempFilters.search) finalFilters.search = tempFilters.search
    if (selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length) {
      finalFilters.status = selectedStatuses.join(',')
    }
    if (selectedTypes.length === 1) {
      finalFilters.type = selectedTypes[0] as 'income' | 'expense'
    }
    if (selectedCategories.length > 0) {
      finalFilters.category_ids = selectedCategories.join(',')
    }
    if (selectedPaymentMethods.length > 0) {
      finalFilters.payment_method_ids = selectedPaymentMethods.join(',')
    }
    if (selectedCustomers.length > 0) {
      finalFilters.customer_ids = selectedCustomers.join(',')
    }
    if (tempFilters.date_from) finalFilters.date_from = tempFilters.date_from
    if (tempFilters.date_to) finalFilters.date_to = tempFilters.date_to
    
    onFiltersChange(finalFilters)
    setOpen(false)
  }

  const handleClear = () => {
    setTempFilters({})
  }

  const activeFiltersCount = Object.keys(filters).filter(key => key !== 'search').length + 
    (filters.search ? 1 : 0)

  const categoryOptions: MultiSelectOption[] = categories?.map(cat => ({
    value: cat.id,
    label: cat.name,
  })) || []

  const paymentMethodOptions: MultiSelectOption[] = paymentMethods?.map(pm => ({
    value: pm.id,
    label: pm.name,
  })) || []

  const customerOptions: MultiSelectOption[] = customers?.map(customer => ({
    value: customer.id,
    label: customer.name,
  })) || []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
          <DialogDescription>
            Aplique filtros para refinar sua busca de lançamentos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Buscar por descrição..."
              value={tempFilters.search || ""}
              onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
            />
          </div>

          {/* Status e Tipo lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <MultiSelect
                options={statusOptions}
                selected={selectedStatuses}
                onChange={(values) => {
                  const newFilters = { ...tempFilters }
                  if (values.length === 0 || values.length === statusOptions.length) {
                    delete newFilters.status
                  } else {
                    newFilters.status = values.join(',')
                  }
                  setTempFilters(newFilters)
                }}
                placeholder="Selecione os status"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <MultiSelect
                options={typeOptions}
                selected={selectedTypes}
                onChange={(values) => {
                  const newFilters = { ...tempFilters }
                  if (values.length === 0 || values.length === typeOptions.length) {
                    delete newFilters.type
                  } else if (values.length === 1) {
                    newFilters.type = values[0] as 'income' | 'expense'
                  } else {
                    delete newFilters.type
                  }
                  setTempFilters(newFilters)
                }}
                placeholder="Selecione os tipos"
              />
            </div>
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    const newFilters = { ...tempFilters }
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
                    setTempFilters(newFilters)
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Categorias */}
          <div className="space-y-2">
            <Label>Categorias</Label>
            <MultiSelect
              options={categoryOptions}
              selected={selectedCategories}
              onChange={(values) => {
                const newFilters = { ...tempFilters }
                if (values.length === 0) {
                  delete newFilters.category_ids
                } else {
                  newFilters.category_ids = values.join(',')
                }
                setTempFilters(newFilters)
              }}
              placeholder="Selecione as categorias"
            />
          </div>

          {/* Formas de Pagamento */}
          <div className="space-y-2">
            <Label>Formas de Pagamento</Label>
            <MultiSelect
              options={paymentMethodOptions}
              selected={selectedPaymentMethods}
              onChange={(values) => {
                const newFilters = { ...tempFilters }
                if (values.length === 0) {
                  delete newFilters.payment_method_ids
                } else {
                  newFilters.payment_method_ids = values.join(',')
                }
                setTempFilters(newFilters)
              }}
              placeholder="Selecione as formas de pagamento"
            />
          </div>

          {/* Clientes */}
          <div className="space-y-2">
            <Label>Clientes</Label>
            <MultiSelect
              options={customerOptions}
              selected={selectedCustomers}
              onChange={(values) => {
                const newFilters = { ...tempFilters }
                if (values.length === 0) {
                  delete newFilters.customer_ids
                } else {
                  newFilters.customer_ids = values.join(',')
                }
                setTempFilters(newFilters)
              }}
              placeholder="Selecione os clientes"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleClear}>
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApply}>
              Aplicar Filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}