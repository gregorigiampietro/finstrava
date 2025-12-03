-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    razao_social TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Company relationship (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- Categories (customizable per company)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name, type)
);

-- Payment Methods (customizable per company)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    allows_installments BOOLEAN DEFAULT FALSE,
    max_installments INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cpf_cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    contact_person TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    agency TEXT,
    initial_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    installment_number INTEGER,
    total_installments INTEGER,
    parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_type TEXT CHECK (recurring_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Services
CREATE TABLE IF NOT EXISTS public.recurring_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31),
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    last_billing_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_categories_company_id ON public.categories(company_id);
CREATE INDEX idx_customers_company_id ON public.customers(company_id);
CREATE INDEX idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX idx_bank_accounts_company_id ON public.bank_accounts(company_id);
CREATE INDEX idx_payment_methods_company_id ON public.payment_methods(company_id);
CREATE INDEX idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX idx_user_companies_company_id ON public.user_companies(company_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_services ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Companies policies
CREATE POLICY "Users can view companies they belong to" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_companies
            WHERE user_companies.company_id = companies.id
            AND user_companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Company owners can update their companies" ON public.companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_companies
            WHERE user_companies.company_id = companies.id
            AND user_companies.user_id = auth.uid()
            AND user_companies.role IN ('owner', 'admin')
        )
    );

-- Generic policy function for company-related tables
CREATE OR REPLACE FUNCTION public.user_has_access_to_company(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_companies.company_id = $1
        AND user_companies.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply generic policies to all company-related tables
CREATE POLICY "Users can view their company's data" ON public.categories
    FOR SELECT USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can manage their company's data" ON public.categories
    FOR ALL USING (public.user_has_access_to_company(company_id));

-- Repeat for other tables
CREATE POLICY "Users can view their company's payment methods" ON public.payment_methods
    FOR SELECT USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can manage their company's payment methods" ON public.payment_methods
    FOR ALL USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can view their company's customers" ON public.customers
    FOR SELECT USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can manage their company's customers" ON public.customers
    FOR ALL USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can view their company's suppliers" ON public.suppliers
    FOR SELECT USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can manage their company's suppliers" ON public.suppliers
    FOR ALL USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can view their company's bank accounts" ON public.bank_accounts
    FOR SELECT USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can manage their company's bank accounts" ON public.bank_accounts
    FOR ALL USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can view their company's transactions" ON public.transactions
    FOR SELECT USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can manage their company's transactions" ON public.transactions
    FOR ALL USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can view their company's recurring services" ON public.recurring_services
    FOR SELECT USING (public.user_has_access_to_company(company_id));

CREATE POLICY "Users can manage their company's recurring services" ON public.recurring_services
    FOR ALL USING (public.user_has_access_to_company(company_id));

-- User companies policies
CREATE POLICY "Users can view their own company associations" ON public.user_companies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Company owners can manage user associations" ON public.user_companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_companies uc
            WHERE uc.company_id = user_companies.company_id
            AND uc.user_id = auth.uid()
            AND uc.role = 'owner'
        )
    );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_services_updated_at BEFORE UPDATE ON public.recurring_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();