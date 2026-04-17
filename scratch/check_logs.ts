import { supabase } from '../db';

async function checkSyncLog() {
  const { data, error } = await supabase
    .from('sync_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching sync logs:', error);
    return;
  }
  console.log('Latest Sync Logs:', JSON.stringify(data, null, 2));
}

checkSyncLog();
