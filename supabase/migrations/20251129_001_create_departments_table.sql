-- Migration: Create departments table for HR module
-- Departamentos com suporte a hierarquia (subdepartamentos)

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  cost_center_code VARCHAR(50),
  budget_monthly DECIMAL(15,2) DEFAULT 0,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, code)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_departments_company ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON public.departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "departments_select" ON public.departments FOR SELECT
  USING (user_has_access_to_company(company_id));

CREATE POLICY "departments_insert" ON public.departments FOR INSERT
  WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "departments_update" ON public.departments FOR UPDATE
  USING (user_has_access_to_company(company_id));

CREATE POLICY "departments_delete" ON public.departments FOR DELETE
  USING (user_has_access_to_company(company_id));

-- Comentários para documentação
COMMENT ON TABLE public.departments IS 'Departamentos da empresa com suporte a hierarquia';
COMMENT ON COLUMN public.departments.parent_id IS 'ID do departamento pai para hierarquia';
COMMENT ON COLUMN public.departments.code IS 'Código único do departamento na empresa';
COMMENT ON COLUMN public.departments.cost_center_code IS 'Código do centro de custo para integração financeira';
COMMENT ON COLUMN public.departments.budget_monthly IS 'Orçamento mensal do departamento';
COMMENT ON COLUMN public.departments.manager_id IS 'ID do funcionário gestor (FK adicionada após criar employees)';
