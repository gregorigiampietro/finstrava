const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));

(async () => {
  console.log('🔍 Verificando dados existentes...\n');

  // Verificar contratos
  console.log('📑 CONTRATOS:');
  const { data: contracts, error: cError } = await supabase
    .from('contracts')
    .select('id, title, status, billing_day, billing_type, next_billing_date, start_date, end_date, monthly_value')
    .limit(10);

  if (cError) {
    console.log('  ❌ Erro:', cError.message);
  } else {
    console.log(`  Total: ${contracts?.length || 0} contratos\n`);
    if (contracts && contracts.length > 0) {
      contracts.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.title}`);
        console.log(`     ID: ${c.id}`);
        console.log(`     Status: ${c.status}`);
        console.log(`     Valor mensal: R$ ${c.monthly_value}`);
        console.log(`     Dia cobrança: ${c.billing_day} | Tipo: ${c.billing_type}`);
        console.log(`     Período: ${c.start_date} até ${c.end_date || 'indeterminado'}`);
        console.log(`     Próxima cobrança: ${c.next_billing_date || 'NÃO DEFINIDA'}`);
        console.log('');
      });
    }
  }

  // Verificar transações
  console.log('\n💰 TRANSAÇÕES:');
  const { data: transactions, error: tError } = await supabase
    .from('transactions')
    .select('id, description, amount, due_date, status, type')
    .order('created_at', { ascending: false })
    .limit(10);

  if (tError) {
    console.log('  ❌ Erro:', tError.message);
  } else {
    console.log(`  Total últimas: ${transactions?.length || 0} transações\n`);
    if (transactions && transactions.length > 0) {
      transactions.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.description}`);
        console.log(`     Tipo: ${t.type} | Valor: R$ ${t.amount}`);
        console.log(`     Vencimento: ${t.due_date} | Status: ${t.status}`);
        console.log('');
      });
    }
  }

  console.log('✅ Verificação concluída!\n');
})();
