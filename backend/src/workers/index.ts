import { env, logger } from '../config';
import { notificationsService } from '../modules/notifications/notifications.service';
import { reservationsService } from '../modules/bookings/reservations.service';

const RESERVATION_INTERVAL_MS = 60_000;
const NOTIFICATION_INTERVAL_MS = 30_000;
const REMINDER_INTERVAL_MS = 15 * 60_000;

export const startWorkers = (): void => {
  if (!env.WORKER_ENABLED) {
    logger.info('Background workers are disabled');
    return;
  }

  setInterval(() => {
    void reservationsService.expireStale().catch((error) => {
      logger.error({ error }, 'Failed to expire stale reservations');
    });
  }, RESERVATION_INTERVAL_MS);

  setInterval(() => {
    void notificationsService.processPendingBatch().catch((error) => {
      logger.error({ error }, 'Failed to process notification batch');
    });
  }, NOTIFICATION_INTERVAL_MS);

  setInterval(() => {
    void notificationsService.enqueueReminders().catch((error) => {
      logger.error({ error }, 'Failed to enqueue booking reminders');
    });
  }, REMINDER_INTERVAL_MS);

  logger.info('Background workers started');
};
