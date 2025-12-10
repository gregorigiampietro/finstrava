"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Check,
  X,
  Ban,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Transaction } from "@/lib/types/transaction"
import { TransactionForm } from "./transaction-form"
import { StatusUpdateDialog } from "./status-update-dialog"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { toast } from "@/hooks/use-toast"

// Função para parsear data sem timezone (evita D-1)
const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface TransactionsTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  onUpdate?: () => void
}

type SortField = 'type' | 'description' | 'package' | 'customer' | 'billing_cycle' | 'category' | 'due_date' | 'amount' | 'status' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

export function TransactionsTable({
  transactions,
  isLoading,
  onUpdate,
}: TransactionsTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'due_date', direction: 'desc' })
  const { deleteTransaction, updateStatus } = useTransactions()

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3" />
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const sortedTransactions = useMemo(() => {
    if (!transactions?.length) return []

    return [...transactions].sort((a, b) => {
      const { field, direction } = sortConfig
      const multiplier = direction === 'asc' ? 1 : -1

      switch (field) {
        case 'type':
          return multiplier * a.type.localeCompare(b.type)
        case 'description':
          return multiplier * a.description.localeCompare(b.description)
        case 'package':
          const packageA = a.contract?.package?.name || ''
          const packageB = b.contract?.package?.name || ''
          return multiplier * packageA.localeCompare(packageB)
        case 'customer':
          const customerA = a.customer?.name || ''
          const customerB = b.customer?.name || ''
          return multiplier * customerA.localeCompare(customerB)
        case 'billing_cycle':
          const cycleA = a.billing_cycle_number || a.installment || 0
          const cycleB = b.billing_cycle_number || b.installment || 0
          return multiplier * (cycleA - cycleB)
        case 'category':
          const catA = a.category?.name || ''
          const catB = b.category?.name || ''
          return multiplier * catA.localeCompare(catB)
        case 'due_date':
          return multiplier * a.due_date.localeCompare(b.due_date)
        case 'amount':
          return multiplier * (a.amount - b.amount)
        case 'status':
          return multiplier * a.status.localeCompare(b.status)
        case 'created_at':
          return multiplier * a.created_at.localeCompare(b.created_at)
        default:
          return 0
      }
    })
  }, [transactions, sortConfig])

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      await deleteTransaction(deletingId)
      toast({
        title: "Lançamento excluído",
        description: "O lançamento foi excluído com sucesso.",
      })
      onUpdate?.()
    } catch (error) {
      console.error("Error deleting transaction:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleCancel = async () => {
    if (!cancellingId) return

    try {
      await updateStatus(cancellingId, "cancelled")
      toast({
        title: "Lançamento cancelado",
        description: "O lançamento foi cancelado com sucesso.",
      })
      onUpdate?.()
    } catch (error) {
      console.error("Error cancelling transaction:", error)
    } finally {
      setCancellingId(null)
    }
  }

  const handleStatusUpdate = async (status: Transaction['status'], paymentDate?: string) => {
    if (!updatingStatusId) return

    try {
      await updateStatus(updatingStatusId, status, paymentDate)
      toast({
        title: "Status atualizado",
        description: "O status do lançamento foi atualizado com sucesso.",
      })
      onUpdate?.()
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleQuickPay = (transaction: Transaction) => {
    setUpdatingStatusId(transaction.id)
  }

  const getStatusBadge = (status: Transaction['status']) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "outline" as const },
      paid: { label: "Pago", variant: "default" as const },
      overdue: { label: "Vencido", variant: "destructive" as const },
      cancelled: { label: "Cancelado", variant: "secondary" as const },
    }

    const config = statusConfig[status]
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Carregando lançamentos...</p>
      </div>
    )
  }

  if (!transactions?.length) {
    return (
      <div className="rounded-md border p-8 text-center bg-card">
        <p className="text-muted-foreground">
          Nenhum lançamento encontrado
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('type')}
                >
                  Tipo
                  {getSortIcon('type')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('description')}
                >
                  Descrição
                  {getSortIcon('description')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('package')}
                >
                  Pacote
                  {getSortIcon('package')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('customer')}
                >
                  Cliente
                  {getSortIcon('customer')}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('billing_cycle')}
                >
                  Mensalidade
                  {getSortIcon('billing_cycle')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('category')}
                >
                  Categoria
                  {getSortIcon('category')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('due_date')}
                >
                  Vencimento
                  {getSortIcon('due_date')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('amount')}
                >
                  Valor
                  {getSortIcon('amount')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort('created_at')}
                >
                  Criado em
                  {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {transaction.type === "income" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{transaction.description}</p>
                </TableCell>
                <TableCell>
                  {transaction.contract?.package?.name ? (
                    <span className="text-sm">{transaction.contract.package.name}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.customer?.name ? (
                    <span className="text-sm">{transaction.customer.name}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {transaction.billing_cycle_number ? (
                    <Badge variant="outline" className="font-mono">
                      #{transaction.billing_cycle_number}
                    </Badge>
                  ) : transaction.installment && transaction.total_installments ? (
                    <Badge variant="outline" className="font-mono">
                      {transaction.installment}/{transaction.total_installments}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.category ? (
                    <Badge variant="outline">
                      {transaction.category.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(parseLocalDate(transaction.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "font-medium",
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {formatCurrency(transaction.amount)}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(transaction.created_at), "dd/MM/yy", { locale: ptBR })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                      {/* Botão Pago - apenas para pendentes */}
                      {transaction.status === "pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleQuickPay(transaction)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Marcar como pago</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Botão Cancelar - apenas para pendentes */}
                      {transaction.status === "pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => setCancellingId(transaction.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Cancelar lançamento</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Botão Editar - apenas para não gerados por contrato */}
                      {!transaction.is_contract_generated && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingTransaction(transaction)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Menu de mais opções */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Mais opções</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {transaction.status === "paid" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(transaction.id, "pending")}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Marcar como pendente
                            </DropdownMenuItem>
                          )}
                          {!transaction.is_contract_generated && (
                            <DropdownMenuItem
                              onClick={() => setDeletingId(transaction.id)}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                          {transaction.is_contract_generated && (
                            <DropdownMenuItem disabled className="text-muted-foreground">
                              <span className="text-xs">Gerado por contrato</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TransactionForm
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction ?? undefined}
        onSuccess={() => {
          setEditingTransaction(null)
          onUpdate?.()
        }}
      />

      <StatusUpdateDialog
        open={!!updatingStatusId}
        onOpenChange={(open) => !open && setUpdatingStatusId(null)}
        onConfirm={handleStatusUpdate}
      />

      {/* Dialog de Exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este lançamento? O lançamento será marcado como cancelado e não será contabilizado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-orange-600 text-white hover:bg-orange-700">
              Cancelar lançamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
