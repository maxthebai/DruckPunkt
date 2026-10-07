import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Settings } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL = 'erinnerungen';

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Erinnerungen',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function rescheduleAll(s: Settings): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s.remindersOn && !s.backupReminder) return;
    if (!(await ensurePermission())) return;

    if (s.remindersOn) {
      for (const t of s.reminderTimes) {
        const [h, m] = t.split(':').map(Number);
        if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Zeit für deine Messung',
            body: 'Das dauert nur zehn Sekunden.',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h,
            minute: m,
            channelId: CHANNEL,
          },
        });
      }
    }
    if (s.backupReminder) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Backup erstellen',
          body: 'Sichere deine Blutdruckwerte einmal im Monat.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: 1,
          hour: 10,
          minute: 0,
          channelId: CHANNEL,
        },
      });
    }
  } catch {
    // Erinnerungen sind optional, die App läuft auch ohne.
  }
}

export async function snoozeReminder(minutes = 30): Promise<void> {
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Zeit für deine Messung', body: 'Kurze Erinnerung, wie gewünscht.' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: CHANNEL,
    },
  });
}
