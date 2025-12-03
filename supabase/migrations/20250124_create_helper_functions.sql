-- Função para criar empresa e associar o usuário como admin
CREATE OR REPLACE FUNCTION public.create_company_with_admin(
    p_name TEXT,
    p_legal_name TEXT DEFAULT NULL,
    p_cnpj TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Criar empresa
    INSERT INTO public.companies (name, legal_name, cnpj)
    VALUES (p_name, p_legal_name, p_cnpj)
    RETURNING id INTO v_company_id;
    
    -- Associar usuário como admin
    INSERT INTO public.user_companies (user_id, company_id, role)
    VALUES (auth.uid(), v_company_id, 'admin');
    
    -- Criar categorias padrão
    PERFORM public.create_default_categories(v_company_id);
    
    -- Criar formas de pagamento padrão
    PERFORM public.create_default_payment_methods(v_company_id);
    
    RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar categorias padrão
CREATE OR REPLACE FUNCTION public.create_default_categories(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Categorias de Receita
    INSERT INTO public.categories (company_id, name, type, color, icon)
    VALUES 
        (p_company_id, 'Vendas', 'income', '#10b981', 'shopping-cart'),
        (p_company_id, 'Serviços', 'income', '#3b82f6', 'briefcase'),
        (p_company_id, 'Outras Receitas', 'income', '#6366f1', 'trending-up');
    
    -- Categorias de Despesa
    INSERT INTO public.categories (company_id, name, type, color, icon)
    VALUES 
        (p_company_id, 'Aluguel', 'expense', '#ef4444', 'home'),
        (p_company_id, 'Salários', 'expense', '#f59e0b', 'users'),
        (p_company_id, 'Fornecedores', 'expense', '#8b5cf6', 'truck'),
        (p_company_id, 'Impostos', 'expense', '#ec4899', 'file-text'),
        (p_company_id, 'Utilidades', 'expense', '#14b8a6', 'zap'),
        (p_company_id, 'Marketing', 'expense', '#f97316', 'megaphone'),
        (p_company_id, 'Outras Despesas', 'expense', '#6b7280', 'more-horizontal');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar formas de pagamento padrão
CREATE OR REPLACE FUNCTION public.create_default_payment_methods(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.payment_methods (company_id, name, type, max_installments)
    VALUES 
        (p_company_id, 'Dinheiro', 'cash', 1),
        (p_company_id, 'PIX', 'pix', 1),
        (p_company_id, 'Cartão de Crédito', 'credit_card', 12),
        (p_company_id, 'Cartão de Débito', 'debit_card', 1),
        (p_company_id, 'Boleto Bancário', 'bank_slip', 1),
        (p_company_id, 'Transferência Bancária', 'bank_transfer', 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter saldo de conta bancária
CREATE OR REPLACE FUNCTION public.get_bank_account_balance(p_account_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT 
        initial_balance + 
        COALESCE(SUM(
            CASE 
                WHEN t.type = 'income' AND t.status = 'paid' THEN t.paid_amount
                WHEN t.type = 'expense' AND t.status = 'paid' THEN -t.paid_amount
                ELSE 0
            END
        ), 0) +
        COALESCE((
            SELECT SUM(amount) FROM public.transfers 
            WHERE to_account_id = p_account_id
        ), 0) -
        COALESCE((
            SELECT SUM(amount) FROM public.transfers 
            WHERE from_account_id = p_account_id
        ), 0)
    INTO v_balance
    FROM public.bank_accounts ba
    LEFT JOIN public.transactions t ON t.bank_account_id = ba.id
    WHERE ba.id = p_account_id
    GROUP BY ba.initial_balance;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar saldo de conta bancária
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'transactions' THEN
        -- Atualizar saldo da conta antiga (se houver)
        IF OLD.bank_account_id IS NOT NULL AND OLD.bank_account_id != NEW.bank_account_id THEN
            UPDATE public.bank_accounts 
            SET current_balance = get_bank_account_balance(OLD.bank_account_id)
            WHERE id = OLD.bank_account_id;
        END IF;
        
        -- Atualizar saldo da conta nova
        IF NEW.bank_account_id IS NOT NULL THEN
            UPDATE public.bank_accounts 
            SET current_balance = get_bank_account_balance(NEW.bank_account_id)
            WHERE id = NEW.bank_account_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'transfers' THEN
        -- Atualizar saldos das contas envolvidas
        UPDATE public.bank_accounts 
        SET current_balance = get_bank_account_balance(NEW.from_account_id)
        WHERE id = NEW.from_account_id;
        
        UPDATE public.bank_accounts 
        SET current_balance = get_bank_account_balance(NEW.to_account_id)
        WHERE id = NEW.to_account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar saldos
CREATE TRIGGER update_balance_on_transaction
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_account_balance();

CREATE TRIGGER update_balance_on_transfer
    AFTER INSERT OR UPDATE OR DELETE ON public.transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_account_balance();

-- Função para criar parcelas de uma transação
CREATE OR REPLACE FUNCTION public.create_transaction_installments(
    p_company_id UUID,
    p_type TEXT,
    p_amount DECIMAL,
    p_description TEXT,
    p_due_date DATE,
    p_installments INTEGER,
    p_category_id UUID DEFAULT NULL,
    p_payment_method_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_supplier_id UUID DEFAULT NULL,
    p_bank_account_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_parent_id UUID;
    v_installment_amount DECIMAL;
    i INTEGER;
BEGIN
    -- Calcular valor de cada parcela
    v_installment_amount := ROUND(p_amount / p_installments, 2);
    
    -- Criar primeira parcela como transação pai
    INSERT INTO public.transactions (
        company_id, type, amount, description, due_date,
        installment, total_installments,
        category_id, payment_method_id, customer_id, supplier_id, bank_account_id,
        created_by
    )
    VALUES (
        p_company_id, p_type, v_installment_amount, 
        p_description || ' (1/' || p_installments || ')',
        p_due_date, 1, p_installments,
        p_category_id, p_payment_method_id, p_customer_id, p_supplier_id, p_bank_account_id,
        auth.uid()
    )
    RETURNING id INTO v_parent_id;
    
    -- Criar parcelas restantes
    FOR i IN 2..p_installments LOOP
        INSERT INTO public.transactions (
            company_id, type, amount, description, due_date,
            installment, total_installments, parent_transaction_id,
            category_id, payment_method_id, customer_id, supplier_id, bank_account_id,
            created_by
        )
        VALUES (
            p_company_id, p_type, v_installment_amount,
            p_description || ' (' || i || '/' || p_installments || ')',
            p_due_date + INTERVAL '1 month' * (i - 1), i, p_installments, v_parent_id,
            p_category_id, p_payment_method_id, p_customer_id, p_supplier_id, p_bank_account_id,
            auth.uid()
        );
    END LOOP;
    
    RETURN v_parent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para Dashboard - Resumo Financeiro
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
    t.company_id,
    DATE_TRUNC('month', t.due_date) as month,
    SUM(CASE WHEN t.type = 'income' AND t.status = 'paid' THEN t.paid_amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' AND t.status = 'paid' THEN t.paid_amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN t.type = 'income' AND t.status = 'pending' THEN t.amount ELSE 0 END) as pending_income,
    SUM(CASE WHEN t.type = 'expense' AND t.status = 'pending' THEN t.amount ELSE 0 END) as pending_expense,
    SUM(CASE WHEN t.type = 'income' AND t.status = 'overdue' THEN t.amount ELSE 0 END) as overdue_income,
    SUM(CASE WHEN t.type = 'expense' AND t.status = 'overdue' THEN t.amount ELSE 0 END) as overdue_expense
FROM public.transactions t
WHERE t.status != 'cancelled'
GROUP BY t.company_id, DATE_TRUNC('month', t.due_date);

-- Função para marcar transações vencidas
CREATE OR REPLACE FUNCTION public.mark_overdue_transactions()
RETURNS VOID AS $$
BEGIN
    UPDATE public.transactions
    SET status = 'overdue'
    WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_company_with_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transaction_installments TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bank_account_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_overdue_transactions TO authenticated, service_role;