"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyInput } from "@/components/ui/currency-input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Transaction, TransactionFormData, RecurringType, recurringTypeLabels } from "@/lib/types/transaction"
import { useTransactions } from "@/lib/hooks/use-transactions"
import { useCategories } from "@/lib/hooks/use-categories"
import { usePaymentMethods } from "@/lib/hooks/use-payment-methods"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useProducts } from "@/lib/hooks/use-products"
import { toast } from "@/hooks/use-toast"

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  description: z.string().min(1, "Descrição é obrigatória"),
  due_date: z.date({
    message: "Data de vencimento é obrigatória",
  }),
  payment_date: z.date().optional(),
  category_id: z.string().optional(),
  payment_method_id: z.string().optional(),
  customer_id: z.string().optional(),
  supplier_id: z.string().optional(),
  bank_account_id: z.string().optional(),
  product_id: z.string().optional(),
  installments: z.number().min(1).max(48).optional(),
  notes: z.string().optional(),
  // Campos de recorrência
  is_recurring: z.boolean().optional(),
  recurring_type: z.enum(['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'weekly']).optional(),
  recurring_times: z.number().min(2).max(60).optional(),
  recurring_end_date: z.date().optional(),
})

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction
  onSuccess?: () => void
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { createTransaction, updateTransaction } = useTransactions()
  const { categories } = useCategories()
  const { paymentMethods } = usePaymentMethods()
  const { customers } = useCustomers()
  const { products } = useProducts()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      amount: 0,
      description: "",
      due_date: new Date(),
      payment_date: undefined,
      category_id: undefined,
      payment_method_id: undefined,
      customer_id: undefined,
      supplier_id: undefined,
      bank_account_id: undefined,
      product_id: undefined,
      installments: 1,
      notes: "",
      is_recurring: false,
      recurring_type: 'monthly' as RecurringType,
      recurring_times: 12,
      recurring_end_date: undefined,
    },
  })

  // Reset form when transaction changes or modal opens
  useEffect(() => {
    if (open && transaction) {
      form.reset({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        due_date: new Date(transaction.due_date),
        payment_date: transaction.payment_date ? new Date(transaction.payment_date) : undefined,
        category_id: transaction.category_id || undefined,
        payment_method_id: transaction.payment_method_id || undefined,
        customer_id: transaction.customer_id || undefined,
        supplier_id: transaction.supplier_id || undefined,
        bank_account_id: transaction.bank_account_id || undefined,
        product_id: transaction.product_id || undefined,
        installments: transaction.total_installments || 1,
        notes: transaction.notes || "",
        is_recurring: false,
        recurring_type: 'monthly' as RecurringType,
        recurring_times: 12,
        recurring_end_date: undefined,
      })
    } else if (open && !transaction) {
      // Reset to default values for new transaction
      form.reset({
        type: "income",
        amount: 0,
        description: "",
        due_date: new Date(),
        payment_date: undefined,
        category_id: undefined,
        payment_method_id: undefined,
        customer_id: undefined,
        supplier_id: undefined,
        bank_account_id: undefined,
        product_id: undefined,
        installments: 1,
        notes: "",
        is_recurring: false,
        recurring_type: 'monthly' as RecurringType,
        recurring_times: 12,
        recurring_end_date: undefined,
      })
    }
  }, [open, transaction, form])

  const transactionType = form.watch("type")
  const selectedPaymentMethod = form.watch("payment_method_id")
  const selectedProduct = form.watch("product_id")
  
  // Get selected payment method details
  const paymentMethod = paymentMethods?.find(pm => pm.id === selectedPaymentMethod)
  const maxInstallments = paymentMethod?.max_installments || 1
  
  // Get selected product details
  const product = products?.find(p => p.id === selectedProduct)
  
  // Update amount when product is selected
  useEffect(() => {
    if (product?.price && !transaction) {
      form.setValue("amount", Number(product.price))
    }
  }, [product, form, transaction])

  // Filter categories by type
  const filteredCategories = categories?.filter(cat => cat.type === transactionType)

  // Função para calcular próxima data baseado no tipo de recorrência
  const getNextDate = (baseDate: Date, recurringType: RecurringType, iteration: number): Date => {
    const nextDate = new Date(baseDate)
    
    switch (recurringType) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + iteration)
        break
      case 'bimonthly':
        nextDate.setMonth(nextDate.getMonth() + (iteration * 2))
        break
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (iteration * 3))
        break
      case 'semiannual':
        nextDate.setMonth(nextDate.getMonth() + (iteration * 6))
        break
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + iteration)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (iteration * 7))
        break
    }
    
    return nextDate
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const data: TransactionFormData = {
        ...values,
        due_date: format(values.due_date, "yyyy-MM-dd"),
        payment_date: values.payment_date ? format(values.payment_date, "yyyy-MM-dd") : null,
      }

      if (transaction) {
        // Remove the installments field before sending to database
        const { installments, ...transactionData } = data
        await updateTransaction(transaction.id, transactionData)
        toast({
          title: "Lançamento atualizado",
          description: "O lançamento foi atualizado com sucesso.",
        })
      } else {
        // Handle recurring transactions
        if (values.is_recurring && values.recurring_times && values.recurring_times > 1) {
          const recurringTimes = values.recurring_times
          const recurringType = values.recurring_type || 'monthly'
          const baseDate = new Date(values.due_date)
          let parentId: string | undefined
          
          // Criar lançamentos recorrentes
          for (let i = 0; i < recurringTimes; i++) {
            const dueDate = getNextDate(baseDate, recurringType, i)
            const monthYear = format(dueDate, "MMM/yyyy", { locale: ptBR })
            
            // Preparar dados da transação
            const { installments, is_recurring, recurring_type: _, recurring_times, recurring_end_date, ...baseData } = data
            
            const transactionData = {
              ...baseData,
              due_date: format(dueDate, "yyyy-MM-dd"),
              description: `${data.description} - ${monthYear}`,
              is_recurring: true,
              recurring_type: recurringType,
              parent_transaction_id: i === 0 ? undefined : parentId,
            }
            
            const result = await createTransaction(transactionData)
            
            // Guardar o ID do primeiro lançamento como parent
            if (i === 0 && result) {
              parentId = result.id
            }
          }
          
          toast({
            title: "Lançamentos recorrentes criados",
            description: `${recurringTimes} lançamentos criados com sucesso.`,
          })
        }
        // Handle installments
        else if (values.installments && values.installments > 1) {
          const installmentAmount = values.amount / installments
          const baseDate = new Date(values.due_date)
          
          for (let i = 0; i < installments; i++) {
            const dueDate = new Date(baseDate)
            dueDate.setMonth(dueDate.getMonth() + i)
            
            await createTransaction({
              ...data,
              amount: installmentAmount,
              due_date: format(dueDate, "yyyy-MM-dd"),
              installment: i + 1,
              total_installments: installments,
              description: `${data.description} (${i + 1}/${installments})`,
            })
          }
          
          toast({
            title: "Lançamentos criados",
            description: `${installments} parcelas criadas com sucesso.`,
          })
        } else {
          // Remove the installments field before sending to database
          const { installments, ...transactionData } = data
          await createTransaction(transactionData)
          toast({
            title: "Lançamento criado",
            description: "O lançamento foi criado com sucesso.",
          })
        }
      }

      onSuccess?.()
    } catch (error) {
      console.error("Error saving transaction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar" : "Novo"} Lançamento
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Edite as informações do lançamento"
              : "Preencha as informações do novo lançamento"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="income" id="income" />
                        <label
                          htmlFor="income"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Receita
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="expense" />
                        <label
                          htmlFor="expense"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Despesa
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value || 0}
                        onChange={field.onChange}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do lançamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods?.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {transactionType === "income" && (
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto/Serviço</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto/serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                          {product.price && ` - R$ ${product.price}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!transaction && paymentMethod?.allows_installments && maxInstallments > 1 && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i}x de R$ {(form.watch("amount") / i).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Dividir em até {maxInstallments} parcelas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Opções de Recorrência - apenas para novos lançamentos */}
            {!transaction && (
              <div className="space-y-4 rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="is_recurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Repetir este lançamento
                        </FormLabel>
                        <FormDescription>
                          Criar múltiplos lançamentos de forma automática
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="recurring_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequência</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(recurringTypeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recurring_times"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de repetições</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={2}
                                max={60}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              {recurringType === 'monthly' && `Criar ${field.value} lançamentos mensais`}
                              {recurringType === 'weekly' && `Criar ${field.value} lançamentos semanais`}
                              {recurringType === 'bimonthly' && `Criar ${field.value} lançamentos bimestrais`}
                              {recurringType === 'quarterly' && `Criar ${field.value} lançamentos trimestrais`}
                              {recurringType === 'semiannual' && `Criar ${field.value} lançamentos semestrais`}
                              {recurringType === 'annual' && `Criar ${field.value} lançamentos anuais`}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Salvando..."
                  : transaction
                  ? "Salvar"
                  : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}