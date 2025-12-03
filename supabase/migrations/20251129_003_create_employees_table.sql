-- Migration: Create employees table for HR module
-- Funcionários com dados completos e integração financeira

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,

  -- Dados Pessoais
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  birth_date DATE,
  gender VARCHAR(20),
  marital_status VARCHAR(20),

  -- Contato
  email VARCHAR(255),
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),

  -- Endereço
  address TEXT,
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),

  -- Dados Bancários
  bank_name VARCHAR(100),
  bank_code VARCHAR(10),
  bank_agency VARCHAR(20),
  bank_account VARCHAR(30),
  bank_account_type VARCHAR(20) CHECK (bank_account_type IN ('checking', 'savings')),
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),

  -- Dados Profissionais
  employee_code VARCHAR(50),
  hire_date DATE NOT NULL,
  termination_date DATE,
  base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  contract_type VARCHAR(50) DEFAULT 'clt' CHECK (contract_type IN ('clt', 'pj', 'intern', 'temporary', 'freelancer')),
  work_hours INTEGER DEFAULT 44,
  payment_day INTEGER DEFAULT 5 CHECK (payment_day >= 1 AND payment_day <= 31),

  -- Vínculos Financeiros
  default_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  default_payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  default_bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vacation', 'leave', 'terminated')),

  notes TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(company_id, cpf)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON public.employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON public.employees(cpf);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON public.employees(hire_date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "employees_select" ON public.employees FOR SELECT
  USING (user_has_access_to_company(company_id));

CREATE POLICY "employees_insert" ON public.employees FOR INSERT
  WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "employees_update" ON public.employees FOR UPDATE
  USING (user_has_access_to_company(company_id));

CREATE POLICY "employees_delete" ON public.employees FOR DELETE
  USING (user_has_access_to_company(company_id));

-- Adicionar FK de manager em departments
ALTER TABLE public.departments
  ADD CONSTRAINT departments_manager_fkey
  FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Comentários para documentação
COMMENT ON TABLE public.employees IS 'Funcionários da empresa com dados completos';
COMMENT ON COLUMN public.employees.cpf IS 'CPF do funcionário (único por empresa)';
COMMENT ON COLUMN public.employees.base_salary IS 'Salário base mensal';
COMMENT ON COLUMN public.employees.contract_type IS 'Tipo de contrato: CLT, PJ, Estagiário, etc.';
COMMENT ON COLUMN public.employees.payment_day IS 'Dia do mês para pagamento do salário';
COMMENT ON COLUMN public.employees.status IS 'Status atual: ativo, inativo, férias, afastado, desligado';
COMMENT ON COLUMN public.employees.default_category_id IS 'Categoria padrão para lançamentos de salário';
COMMENT ON COLUMN public.employees.default_payment_method_id IS 'Forma de pagamento padrão';
COMMENT ON COLUMN public.employees.default_bank_account_id IS 'Conta bancária da empresa para débito';
