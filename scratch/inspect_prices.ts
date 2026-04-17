import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkPrices() {
  const symbol = 'VJC';
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Latest Prices for ${symbol}:`, JSON.stringify(data, null, 2));
}

checkPrices();
