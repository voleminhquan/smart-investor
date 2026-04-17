import cron from 'node-cron';
import { syncAll } from './vnstock-worker';

let isSyncing = false;

/**
 * Start the sync scheduler.
 * Schedule: Weekdays (Mon-Fri), every hour from 9:00 to 16:00 (Vietnam time, UTC+7 = 2:00-9:00 UTC)
 */
export function startScheduler(): void {
  // Cron: At minute 0, hours 2-9 UTC (= 9-16 ICT), Mon-Fri
  // Format: minute hour day-of-month month day-of-week
  const schedule = '0 2-9 * * 1-5';

  cron.schedule(schedule, async () => {
    if (isSyncing) {
      console.log('⏭️  Sync already running, skipping...');
      return;
    }

    isSyncing = true;
    try {
      await syncAll();
    } catch (err) {
      console.error('❌ Scheduler sync error:', err);
    } finally {
      isSyncing = false;
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  console.log('⏰ Scheduler started: Weekdays 9:00-16:00 ICT, every hour');
}
