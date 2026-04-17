const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: ratios } = await supabase.from('financial_ratios').select('*').eq('symbol', 'FPT').limit(1);
  const { data: inc } = await supabase.from('income_statement').select('*').eq('symbol', 'FPT').limit(1);
  const { data: bal } = await supabase.from('balance_sheet').select('*').eq('symbol', 'FPT').limit(1);
  const { data: comp } = await supabase.from('companies').select('*').eq('symbol', 'FPT').limit(1);
  console.log('RATIOS:', ratios);
  console.log('INCOME:', inc);
  console.log('BALANCE:', bal);
  console.log('COMPANY:', comp);
}
check();
