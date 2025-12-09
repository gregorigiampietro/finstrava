export type EmployeeStatus = 'active' | 'inactive' | 'vacation' | 'leave' | 'terminated';
export type ContractType = 'clt' | 'pj' | 'intern' | 'temporary' | 'freelancer';
export type BankAccountType = 'checking' | 'savings';
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface Employee {
  id: string;
  company_id: string;
  department_id?: string;
  position_id?: string;

  // Dados Pessoais
  name: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;

  // Contato
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // Endereço
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;

  // Dados Bancários
  bank_name?: string;
  bank_code?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: BankAccountType;
  pix_key?: string;
  pix_key_type?: PixKeyType;

  // Dados Profissionais
  employee_code?: string;
  hire_date: string;
  termination_date?: string;
  base_salary: number;
  contract_type: ContractType;
  work_hours: number;
  payment_day: number;

  // Vínculos Financeiros
  default_category_id?: string;
  default_payment_method_id?: string;
  default_bank_account_id?: string;

  // Status
  status: EmployeeStatus;
  notes?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relações
  department?: { id: string; name: string };
  position?: { id: string; name: string };
  default_category?: { id: string; name: string };
  default_payment_method?: { id: string; name: string };
  default_bank_account?: { id: string; name: string };
}

export interface EmployeeFormData {
  name: string;
  department_id?: string | null;
  position_id?: string | null;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  bank_name?: string;
  bank_code?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: BankAccountType;
  pix_key?: string;
  pix_key_type?: PixKeyType;
  employee_code?: string;
  hire_date: string;
  termination_date?: string;
  base_salary: number;
  contract_type?: ContractType;
  work_hours?: number;
  payment_day: number;
  default_category_id?: string | null;
  default_payment_method_id?: string | null;
  default_bank_account_id?: string | null;
  status?: EmployeeStatus;
  notes?: string;
}

export const employeeStatusLabels: Record<EmployeeStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  vacation: 'Férias',
  leave: 'Afastado',
  terminated: 'Desligado',
};

export const contractTypeLabels: Record<ContractType, string> = {
  clt: 'CLT',
  pj: 'PJ',
  intern: 'Estagiário',
  temporary: 'Temporário',
  freelancer: 'Freelancer',
};

export const bankAccountTypeLabels: Record<BankAccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
};

export const pixKeyTypeLabels: Record<PixKeyType, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'Email',
  phone: 'Telefone',
  random: 'Chave Aleatória',
};
