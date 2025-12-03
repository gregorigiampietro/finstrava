const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

const supabase = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_KEY') // Usando service key para ter acesso total
);

(async () => {
  console.log('🔍 Verificando com MCP do Supabase...\n');

  // 1. Verificar tabela financial_entries
  console.log('📋 TABELA FINANCIAL_ENTRIES:');
  const { data: entries, error: entriesError, count } = await supabase
    .from('financial_entries')
    .select('*', { count: 'exact' })
    .limit(10);

  if (entriesError) {
    console.log(`  ❌ Erro: ${entriesError.message}`);
  } else {
    console.log(`  ✅ Tabela existe! Total de registros: ${count || 0}\n`);
    if (entries && entries.length > 0) {
      entries.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.description || 'Sem descrição'}`);
        console.log(`     Tipo: ${e.type} | Valor: R$ ${e.amount}`);
        console.log(`     Vencimento: ${e.due_date} | Status: ${e.status}`);
        console.log(`     Contract ID: ${e.contract_id || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('  (Nenhum lançamento encontrado)\n');
    }
  }

  // 2. Verificar contratos
  console.log('📑 CONTRATOS:');
  const { data: contracts, error: cError } = await supabase
    .from('contracts')
    .select('id, title, status, billing_day, billing_type, next_billing_date, monthly_value, customer_id')
    .limit(10);

  if (cError) {
    console.log(`  ❌ Erro: ${cError.message}`);
  } else {
    console.log(`  Total: ${contracts?.length || 0} contratos\n`);
    if (contracts && contracts.length > 0) {
      contracts.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.title}`);
        console.log(`     ID: ${c.id}`);
        console.log(`     Status: ${c.status}`);
        console.log(`     Valor mensal: R$ ${c.monthly_value}`);
        console.log(`     Dia cobrança: ${c.billing_day} | Tipo: ${c.billing_type}`);
        console.log(`     Próxima cobrança: ${c.next_billing_date || 'NÃO DEFINIDA'}`);
        console.log('');
      });
    }
  }

  // 3. Listar todas as tabelas do schema public
  console.log('📊 TODAS AS TABELAS DO BANCO:');
  const { data: tables } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
    })
    .catch(() => ({ data: null }));

  if (tables) {
    console.log('  ', tables);
  } else {
    // Alternativa: tentar listar usando from()
    const tablesToCheck = [
      'contracts', 'contract_items', 'contract_history',
      'financial_entries', 'transactions', 'customers',
      'products', 'companies', 'categories', 'payment_methods'
    ];

    console.log('  Verificando tabelas conhecidas:');
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
      console.log(`    ${error ? '❌' : '✅'} ${table}`);
    }
  }

  console.log('\n✅ Verificação concluída!\n');
})();
