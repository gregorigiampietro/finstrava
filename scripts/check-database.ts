import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const getEnv = (key: string) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Verificando estrutura do banco de dados...\n');

  // 1. Verificar tabelas existentes
  console.log('📋 TABELAS:');
  const tables = ['contracts', 'contract_items', 'contract_history', 'transactions', 'customers', 'products'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ ${table}: NÃO EXISTE (${error.message})`);
    } else {
      console.log(`  ✅ ${table}: existe`);
    }
  }

  // 2. Verificar contratos existentes
  console.log('\n📑 CONTRATOS CADASTRADOS:');
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select(`
      id,
      title,
      status,
      start_date,
      billing_day,
      billing_type,
      next_billing_date,
      customer:customers(name)
    `);

  if (contractsError) {
    console.log(`  ❌ Erro ao buscar contratos: ${contractsError.message}`);
  } else if (contracts && contracts.length > 0) {
    contracts.forEach((c: any) => {
      console.log(`  • ${c.title} - Cliente: ${c.customer?.name || 'N/A'}`);
      console.log(`    Status: ${c.status}, Dia cobrança: ${c.billing_day}, Tipo: ${c.billing_type}`);
      console.log(`    Próxima cobrança: ${c.next_billing_date || 'Não definida'}`);
    });
  } else {
    console.log('  (Nenhum contrato cadastrado)');
  }

  // 3. Verificar transações geradas de contratos
  console.log('\n💰 TRANSAÇÕES DE CONTRATOS:');
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select(`
      id,
      description,
      amount,
      due_date,
      status,
      customer:customers(name)
    `)
    .order('due_date', { ascending: false })
    .limit(10);

  if (transactionsError) {
    console.log(`  ❌ Erro ao buscar transações: ${transactionsError.message}`);
  } else if (transactions && transactions.length > 0) {
    transactions.forEach((t: any) => {
      console.log(`  • ${t.description} - R$ ${t.amount}`);
      console.log(`    Cliente: ${t.customer?.name || 'N/A'}, Vencimento: ${t.due_date}, Status: ${t.status}`);
    });
  } else {
    console.log('  (Nenhuma transação encontrada)');
  }

  // 4. Verificar funções RPC
  console.log('\n⚙️  FUNÇÕES RPC:');
  const rpcFunctions = [
    'generate_contract_transactions',
    'calculate_next_billing_date',
    'process_contract_renewals',
    'expire_contracts',
    'cancel_contract_with_fee'
  ];

  for (const func of rpcFunctions) {
    try {
      const { error } = await supabase.rpc(func as any, {});
      if (error && error.message.includes('Could not find the function')) {
        console.log(`  ❌ ${func}: NÃO EXISTE`);
      } else {
        console.log(`  ✅ ${func}: existe`);
      }
    } catch (e) {
      console.log(`  ❌ ${func}: NÃO EXISTE`);
    }
  }

  console.log('\n✨ Verificação concluída!\n');
}

checkDatabase().catch(console.error);
