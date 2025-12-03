-- Função auxiliar para verificar se usuário tem acesso à empresa
CREATE OR REPLACE FUNCTION public.user_has_access_to_company(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = auth.uid()
        AND company_id = user_has_access_to_company.company_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se usuário é admin da empresa
CREATE OR REPLACE FUNCTION public.user_is_company_admin(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = auth.uid()
        AND company_id = user_is_company_admin.company_id
        AND role = 'admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para Companies
CREATE POLICY "Users can view companies they belong to"
    ON public.companies FOR SELECT
    USING (user_has_access_to_company(id));

CREATE POLICY "Only admins can update companies"
    ON public.companies FOR UPDATE
    USING (user_is_company_admin(id));

CREATE POLICY "Authenticated users can create companies"
    ON public.companies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para User_Companies
CREATE POLICY "Users can view their own company associations"
    ON public.user_companies FOR SELECT
    USING (user_id = auth.uid() OR user_has_access_to_company(company_id));

CREATE POLICY "Only company admins can manage user associations"
    ON public.user_companies FOR INSERT
    WITH CHECK (user_is_company_admin(company_id));

CREATE POLICY "Only company admins can update user associations"
    ON public.user_companies FOR UPDATE
    USING (user_is_company_admin(company_id));

CREATE POLICY "Only company admins can delete user associations"
    ON public.user_companies FOR DELETE
    USING (user_is_company_admin(company_id));

-- Políticas para Categories
CREATE POLICY "Users can view categories from their companies"
    ON public.categories FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create categories for their companies"
    ON public.categories FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update categories from their companies"
    ON public.categories FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete categories from their companies"
    ON public.categories FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Payment Methods
CREATE POLICY "Users can view payment methods from their companies"
    ON public.payment_methods FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create payment methods for their companies"
    ON public.payment_methods FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update payment methods from their companies"
    ON public.payment_methods FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete payment methods from their companies"
    ON public.payment_methods FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Customers
CREATE POLICY "Users can view customers from their companies"
    ON public.customers FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create customers for their companies"
    ON public.customers FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update customers from their companies"
    ON public.customers FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete customers from their companies"
    ON public.customers FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Suppliers
CREATE POLICY "Users can view suppliers from their companies"
    ON public.suppliers FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create suppliers for their companies"
    ON public.suppliers FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update suppliers from their companies"
    ON public.suppliers FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete suppliers from their companies"
    ON public.suppliers FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Bank Accounts
CREATE POLICY "Users can view bank accounts from their companies"
    ON public.bank_accounts FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create bank accounts for their companies"
    ON public.bank_accounts FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update bank accounts from their companies"
    ON public.bank_accounts FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete bank accounts from their companies"
    ON public.bank_accounts FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Products
CREATE POLICY "Users can view products from their companies"
    ON public.products FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create products for their companies"
    ON public.products FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update products from their companies"
    ON public.products FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete products from their companies"
    ON public.products FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Transactions
CREATE POLICY "Users can view transactions from their companies"
    ON public.transactions FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create transactions for their companies"
    ON public.transactions FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update transactions from their companies"
    ON public.transactions FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete transactions from their companies"
    ON public.transactions FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Transfers
CREATE POLICY "Users can view transfers from their companies"
    ON public.transfers FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create transfers for their companies"
    ON public.transfers FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can update transfers from their companies"
    ON public.transfers FOR UPDATE
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete transfers from their companies"
    ON public.transfers FOR DELETE
    USING (user_has_access_to_company(company_id));

-- Políticas para Attachments
CREATE POLICY "Users can view attachments from their companies"
    ON public.attachments FOR SELECT
    USING (user_has_access_to_company(company_id));

CREATE POLICY "Users can create attachments for their companies"
    ON public.attachments FOR INSERT
    WITH CHECK (user_has_access_to_company(company_id));

CREATE POLICY "Users can delete attachments from their companies"
    ON public.attachments FOR DELETE
    USING (user_has_access_to_company(company_id));