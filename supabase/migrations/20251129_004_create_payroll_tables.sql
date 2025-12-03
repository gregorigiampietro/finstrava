-- Migration: Create payroll tables for HR module
-- Sistema de folha de pagamento com integração financeira

-- Tabela de Folhas de Pagamento
CREATE TABLE IF NOT EXISTS public.payrolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid', 'cancelled')),
  total_gross DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  total_net DECIMAL(15,2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  notes TEXT,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, reference_month)
);

-- Tabela de Itens da Folha (por funcionário)
CREATE TABLE IF NOT EXISTS public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id UUID NOT NULL REFERENCES public.payrolls(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  position_id UUID REFERENCES public.positions(id),

  -- Valores
  base_salary DECIMAL(15,2) NOT NULL,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  overtime_value DECIMAL(15,2) DEFAULT 0,
  bonuses DECIMAL(15,2) DEFAULT 0,
  commissions DECIMAL(15,2) DEFAULT 0,
  other_earnings DECIMAL(15,2) DEFAULT 0,
  total_earnings DECIMAL(15,2) DEFAULT 0,

  -- Deduções
  inss_deduction DECIMAL(15,2) DEFAULT 0,
  irrf_deduction DECIMAL(15,2) DEFAULT 0,
  other_deductions DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,

  -- Totais
  gross_salary DECIMAL(15,2) NOT NULL,
  net_salary DECIMAL(15,2) NOT NULL,

  -- Vínculo com lançamento financeiro gerado
  financial_entry_id UUID REFERENCES public.financial_entries(id) ON DELETE SET NULL,

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(payroll_id, employee_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payrolls_company ON public.payrolls(company_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON public.payrolls(status);
CREATE INDEX IF NOT EXISTS idx_payrolls_reference_month ON public.payrolls(reference_month);
CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll ON public.payroll_items(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON public.payroll_items(employee_id);

-- Triggers
CREATE TRIGGER update_payrolls_updated_at
  BEFORE UPDATE ON public.payrolls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payroll_items_updated_at
  BEFORE UPDATE ON public.payroll_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS para payrolls
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payrolls_select" ON public.payrolls FOR SELECT
  USING (user_has_access_to_company(company_id));

CREATE POLICY "payrolls_insert" ON public.payrolls FOR INSERT
  WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "payrolls_update" ON public.payrolls FOR UPDATE
  USING (user_has_access_to_company(company_id));

CREATE POLICY "payrolls_delete" ON public.payrolls FOR DELETE
  USING (user_has_access_to_company(company_id));

-- RLS para payroll_items (via payroll)
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_items_select" ON public.payroll_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.payrolls p
    WHERE p.id = payroll_id AND user_has_access_to_company(p.company_id)
  ));

CREATE POLICY "payroll_items_insert" ON public.payroll_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.payrolls p
    WHERE p.id = payroll_id AND user_has_access_to_company(p.company_id)
  ));

CREATE POLICY "payroll_items_update" ON public.payroll_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.payrolls p
    WHERE p.id = payroll_id AND user_has_access_to_company(p.company_id)
  ));

CREATE POLICY "payroll_items_delete" ON public.payroll_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.payrolls p
    WHERE p.id = payroll_id AND user_has_access_to_company(p.company_id)
  ));

-- Estender financial_entries para vincular com funcionários e folha
ALTER TABLE public.financial_entries
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payroll_id UUID REFERENCES public.payrolls(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payroll_item_id UUID REFERENCES public.payroll_items(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_payroll_generated BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_financial_entries_employee ON public.financial_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_payroll ON public.financial_entries(payroll_id);

-- Função para gerar lançamentos financeiros da folha aprovada
CREATE OR REPLACE FUNCTION public.generate_payroll_financial_entries(p_payroll_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_payroll RECORD;
  v_item RECORD;
  v_entry_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Buscar dados da folha
  SELECT * INTO v_payroll FROM public.payrolls WHERE id = p_payroll_id;

  IF v_payroll.status != 'approved' THEN
    RAISE EXCEPTION 'Folha deve estar aprovada para gerar lançamentos';
  END IF;

  -- Iterar sobre cada item da folha
  FOR v_item IN
    SELECT pi.*, e.name as employee_name, e.default_category_id,
           e.default_payment_method_id, e.default_bank_account_id
    FROM public.payroll_items pi
    JOIN public.employees e ON e.id = pi.employee_id
    WHERE pi.payroll_id = p_payroll_id
    AND pi.financial_entry_id IS NULL
  LOOP
    -- Criar lançamento financeiro
    INSERT INTO public.financial_entries (
      company_id, type, status, amount, due_date, description,
      category_id, payment_method_id, bank_account_id,
      employee_id, payroll_id, payroll_item_id, is_payroll_generated
    ) VALUES (
      v_payroll.company_id, 'expense', 'pending', v_item.net_salary,
      v_payroll.payment_date,
      'Salário ' || TO_CHAR(v_payroll.reference_month, 'MM/YYYY') || ' - ' || v_item.employee_name,
      v_item.default_category_id, v_item.default_payment_method_id, v_item.default_bank_account_id,
      v_item.employee_id, p_payroll_id, v_item.id, true
    ) RETURNING id INTO v_entry_id;

    -- Atualizar item com referência ao lançamento
    UPDATE public.payroll_items SET financial_entry_id = v_entry_id WHERE id = v_item.id;

    v_count := v_count + 1;
  END LOOP;

  -- Atualizar status da folha
  UPDATE public.payrolls SET status = 'paid', paid_at = NOW() WHERE id = p_payroll_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular folha (adicionar funcionários ativos)
CREATE OR REPLACE FUNCTION public.calculate_payroll(p_payroll_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_payroll RECORD;
  v_employee RECORD;
  v_count INTEGER := 0;
  v_total_gross DECIMAL(15,2) := 0;
  v_total_net DECIMAL(15,2) := 0;
BEGIN
  -- Buscar dados da folha
  SELECT * INTO v_payroll FROM public.payrolls WHERE id = p_payroll_id;

  IF v_payroll.status != 'draft' THEN
    RAISE EXCEPTION 'Folha deve estar em rascunho para ser calculada';
  END IF;

  -- Limpar itens existentes
  DELETE FROM public.payroll_items WHERE payroll_id = p_payroll_id;

  -- Adicionar todos os funcionários ativos (exceto PJ e Freelancer)
  FOR v_employee IN
    SELECT * FROM public.employees
    WHERE company_id = v_payroll.company_id
    AND status = 'active'
    AND contract_type NOT IN ('pj', 'freelancer')
    AND deleted_at IS NULL
  LOOP
    INSERT INTO public.payroll_items (
      payroll_id, employee_id, department_id, position_id,
      base_salary, gross_salary, net_salary
    ) VALUES (
      p_payroll_id, v_employee.id, v_employee.department_id, v_employee.position_id,
      v_employee.base_salary, v_employee.base_salary, v_employee.base_salary
    );

    v_total_gross := v_total_gross + v_employee.base_salary;
    v_total_net := v_total_net + v_employee.base_salary;
    v_count := v_count + 1;
  END LOOP;

  -- Atualizar totais da folha
  UPDATE public.payrolls SET
    status = 'calculated',
    employee_count = v_count,
    total_gross = v_total_gross,
    total_net = v_total_net
  WHERE id = p_payroll_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE public.payrolls IS 'Folhas de pagamento mensais';
COMMENT ON TABLE public.payroll_items IS 'Itens da folha de pagamento por funcionário';
COMMENT ON FUNCTION public.generate_payroll_financial_entries IS 'Gera lançamentos financeiros para folha aprovada';
COMMENT ON FUNCTION public.calculate_payroll IS 'Calcula folha adicionando funcionários ativos';
