import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useCompany } from "@/lib/contexts/company-context"

export interface CompanyCustomerKPIs {
  total_customers: number
  leads: number
  active_customers: number
  churned_customers: number
  activation_rate: number
  churn_rate: number
  total_ltv: number
  average_ltv: number
  total_mrr: number
  average_mrr_per_customer: number
  total_active_contracts: number
  avg_customer_lifetime_months: number
}

export interface CustomerWithKPIs {
  id: string
  name: string
  status: 'lead' | 'active' | 'churned'
  first_payment_at: string | null
  churned_at: string | null
  customer_since: string
  total_contracts: number
  active_contracts: number
  ltv: number
  mrr: number
  total_payments: number
  last_activity: string | null
  months_as_customer: number
}

export function useCompanyCustomerKPIs() {
  const { selectedCompany } = useCompany()
  const supabase = createClient()

  const fetcher = async (): Promise<CompanyCustomerKPIs | null> => {
    if (!selectedCompany?.id) return null

    const { data, error } = await supabase
      .rpc('get_company_customer_kpis', { p_company_id: selectedCompany.id })

    if (error) {
      console.error("Error fetching customer KPIs:", error)
      throw error
    }

    return data as CompanyCustomerKPIs
  }

  const key = selectedCompany?.id
    ? ["customer-kpis", selectedCompany.id]
    : null

  const { data, error, mutate, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    kpis: data,
    error,
    isLoading,
    mutate,
  }
}

export function useCustomersWithKPIs(status?: 'lead' | 'active' | 'churned') {
  const { selectedCompany } = useCompany()
  const supabase = createClient()

  const fetcher = async (): Promise<CustomerWithKPIs[]> => {
    if (!selectedCompany?.id) return []

    const { data, error } = await supabase
      .rpc('get_customers_with_kpis', {
        p_company_id: selectedCompany.id,
        p_status: status || null
      })

    if (error) {
      console.error("Error fetching customers with KPIs:", error)
      throw error
    }

    return data as CustomerWithKPIs[]
  }

  const key = selectedCompany?.id
    ? ["customers-with-kpis", selectedCompany.id, status || "all"]
    : null

  const { data, error, mutate, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    customers: data || [],
    error,
    isLoading,
    mutate,
  }
}
