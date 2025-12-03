import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useCompany } from "@/lib/contexts/company-context"
import { Transaction, TransactionFilters } from "@/lib/types/transaction"
import { toast } from "@/hooks/use-toast"

export function useTransactions(filters?: TransactionFilters) {
  const { selectedCompany } = useCompany()
  const supabase = createClient()

  const fetcher = async () => {
    if (!selectedCompany?.id) return []

    let query = supabase
      .from("financial_entries")
      .select(`
        *,
        category:categories(id, name, type, color),
        payment_method:payment_methods(id, name, type),
        customer:customers(id, name, document),
        supplier:suppliers(id, name, document),
        bank_account:bank_accounts(id, name, bank_name),
        product:products(id, name, type),
        contract:contracts(id, title, contract_number, package:packages(id, name))
      `)
      .eq("company_id", selectedCompany.id)
      .order("due_date", { ascending: false })

    // Apply filters
    if (filters?.type) {
      query = query.eq("type", filters.type)
    }
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }
    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id)
    }
    if (filters?.payment_method_id) {
      query = query.eq("payment_method_id", filters.payment_method_id)
    }
    if (filters?.customer_id) {
      query = query.eq("customer_id", filters.customer_id)
    }
    if (filters?.supplier_id) {
      query = query.eq("supplier_id", filters.supplier_id)
    }
    if (filters?.date_from) {
      query = query.gte("due_date", filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte("due_date", filters.date_to)
    }
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching transactions:", error)
      throw error
    }

    return data as Transaction[]
  }

  const key = selectedCompany?.id 
    ? ["transactions", selectedCompany.id, JSON.stringify(filters || {})] 
    : null

  const { data, error, mutate, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  })

  const createTransaction = async (transaction: Partial<Transaction>) => {
    if (!selectedCompany?.id) {
      toast({
        title: "Erro",
        description: "Selecione uma empresa primeiro",
        variant: "destructive",
      })
      return
    }

    const { data, error } = await supabase
      .from("financial_entries")
      .insert([{
        ...transaction,
        company_id: selectedCompany.id,
      }])
      .select()
      .single()

    if (error) {
      toast({
        title: "Erro ao criar lançamento",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }

    await mutate()
    return data
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { error } = await supabase
      .from("financial_entries")
      .update(updates)
      .eq("id", id)
      .eq("company_id", selectedCompany?.id)

    if (error) {
      toast({
        title: "Erro ao atualizar lançamento",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }

    await mutate()
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from("financial_entries")
      .delete()
      .eq("id", id)
      .eq("company_id", selectedCompany?.id)

    if (error) {
      toast({
        title: "Erro ao excluir lançamento",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }

    await mutate()
  }

  const updateStatus = async (id: string, status: Transaction['status'], paymentDate?: string) => {
    const updates: any = { status }
    
    if (status === 'paid' && paymentDate) {
      updates.payment_date = paymentDate
    } else if (status !== 'paid') {
      updates.payment_date = null
    }

    await updateTransaction(id, updates)
  }

  return {
    transactions: data,
    error,
    isLoading,
    mutate,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateStatus,
  }
}