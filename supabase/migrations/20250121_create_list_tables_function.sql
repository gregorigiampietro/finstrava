-- Função para listar todas as tabelas do banco de dados
CREATE OR REPLACE FUNCTION public.list_all_tables()
RETURNS TABLE(
    schema_name text,
    table_name text,
    table_type text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        schemaname::text as schema_name,
        tablename::text as table_name,
        'table'::text as table_type
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'storage', 'vault', '_analytics', '_realtime', 'auth', 'extensions', 'realtime', 'supabase_functions', 'supabase_migrations', 'cron', 'dbdev', 'graphql', 'graphql_public', 'net', 'pgmq', 'pgsodium', 'pgsodium_masks', 'pgtle', 'repack', 'tiger', 'tiger_data', 'timescaledb_*', '_timescaledb_*', 'topology')
    
    UNION ALL
    
    SELECT 
        schemaname::text as schema_name,
        viewname::text as table_name,
        'view'::text as table_type
    FROM pg_views
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'storage', 'vault', '_analytics', '_realtime', 'auth', 'extensions', 'realtime', 'supabase_functions', 'supabase_migrations', 'cron', 'dbdev', 'graphql', 'graphql_public', 'net', 'pgmq', 'pgsodium', 'pgsodium_masks', 'pgtle', 'repack', 'tiger', 'tiger_data', 'timescaledb_*', '_timescaledb_*', 'topology')
    
    ORDER BY schema_name, table_name;
$$;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.list_all_tables TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_tables TO service_role;