"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Filter, X, Check, Calendar, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

function CompactMultiSelect({
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

  const getButtonLabel = () => {
    if (selected.length === 0) return placeholder
    if (selected.length === options.length) return "Todos"
    if (selected.length === 1) {
      const option = options.find(o => o.value === selected[0])
      return option?.label || placeholder
    }
    return `${selected.length} selecionados`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between text-xs h-8"
        >
          <span className="truncate">{getButtonLabel()}</span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1" align="start">
        <ScrollArea className="h-[150px]">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 p-1.5 rounded hover:bg-accent cursor-pointer"
              onClick={() => toggleOption(option.value)}
            >
              <div className={cn(
                "h-3 w-3 border rounded-sm flex items-center justify-center",
                selected.includes(option.value) ? "bg-primary border-primary" : "border-muted-foreground"
              )}>
                {selected.includes(option.value) && <Check className="h-2 w-2 text-primary-foreground" />}
              </div>
              <label className="text-xs cursor-pointer flex-1">
                {option.label}
              </label>
            </div>
          ))}
        </ScrollArea>
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
    if (!open) {
      setTempFilters(filters)
    }
  }, [open, filters])

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
    onFiltersChange({})
    setTempFilters({})
    setOpen(false)
  }

  const activeFiltersCount = Object.keys(filters).length

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtros</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-auto p-1 text-xs"
            >
              Limpar
            </Button>
          </div>
          
          <Separator />
          
          {/* Busca */}
          <div className="space-y-1.5">
            <Label className="text-xs">Buscar</Label>
            <Input
              placeholder="Descrição..."
              value={tempFilters.search || ""}
              onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* Status e Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <CompactMultiSelect
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
                placeholder="Status"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <CompactMultiSelect
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
                placeholder="Tipo"
              />
            </div>
          </div>

          {/* Período */}
          <div className="space-y-1.5">
            <Label className="text-xs">Período</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-1.5 h-3 w-3" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione o período</span>
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
          <div className="space-y-1.5">
            <Label className="text-xs">Categorias</Label>
            <CompactMultiSelect
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
              placeholder="Todas as categorias"
            />
          </div>

          {/* Clientes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Clientes</Label>
            <CompactMultiSelect
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
              placeholder="Todos os clientes"
            />
          </div>

          <Separator />
          
          {/* Botões */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1 h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 h-8 text-xs"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}