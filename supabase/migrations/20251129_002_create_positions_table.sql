-- Migration: Create positions table for HR module
-- Cargos vinculados a departamentos

CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  salary_range_min DECIMAL(15,2),
  salary_range_max DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_positions_company ON public.positions(company_id);
CREATE INDEX IF NOT EXISTS idx_positions_department ON public.positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON public.positions(is_active);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "positions_select" ON public.positions FOR SELECT
  USING (user_has_access_to_company(company_id));

CREATE POLICY "positions_insert" ON public.positions FOR INSERT
  WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "positions_update" ON public.positions FOR UPDATE
  USING (user_has_access_to_company(company_id));

CREATE POLICY "positions_delete" ON public.positions FOR DELETE
  USING (user_has_access_to_company(company_id));

-- Comentários para documentação
COMMENT ON TABLE public.positions IS 'Cargos da empresa vinculados a departamentos';
COMMENT ON COLUMN public.positions.department_id IS 'Departamento ao qual o cargo pertence';
COMMENT ON COLUMN public.positions.salary_range_min IS 'Faixa salarial mínima para o cargo';
COMMENT ON COLUMN public.positions.salary_range_max IS 'Faixa salarial máxima para o cargo';
