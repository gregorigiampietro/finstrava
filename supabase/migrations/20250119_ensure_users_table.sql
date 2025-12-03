-- Verificar e criar tabela users se não existir
DO $$
BEGIN
    -- Verificar se a tabela users existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users') THEN
        
        -- Create users table (extends Supabase auth.users)
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            full_name TEXT,
            avatar_url TEXT,
            phone TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create updated_at trigger function if not exists
        CREATE OR REPLACE FUNCTION public.update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON public.users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();

        -- Create function to handle new user creation
        CREATE OR REPLACE FUNCTION public.handle_new_user() 
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.users (id, email, full_name, avatar_url)
            VALUES (
                NEW.id, 
                NEW.email,
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'avatar_url'
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Trigger to automatically create user profile
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW 
            EXECUTE FUNCTION public.handle_new_user();

        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Policies for users table
        CREATE POLICY "Users can view own profile" 
            ON public.users 
            FOR SELECT 
            USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" 
            ON public.users 
            FOR UPDATE 
            USING (auth.uid() = id);

        -- Create indexes
        CREATE INDEX idx_users_email ON public.users(email);
        CREATE INDEX idx_users_is_active ON public.users(is_active);
    END IF;
END $$;