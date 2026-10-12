import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { Reminder, Settings } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Neue Channel-ID: Android erlaubt nachträglich keine Änderung der Wichtigkeit.
const CHANNEL = 'erinnerungen-v2';
const OLD_CHANNEL = 'erinnerungen';
const BACKUP_ID = 'backup-monatlich';
const MAX_REMINDERS = 8;
export const MAX_REMINDER_COUNT = MAX_REMINDERS;

// ISO-Wochentag (1 = Montag ... 7 = Sonntag) -> Expo (1 = Sonntag ... 7 = Samstag)
const toExpoWeekday = (iso: number) => (iso % 7) + 1;

export function parseTime(t: string): { h: number; m: number } | null {
  const mt = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t);
  return mt ? { h: Number(mt[1]), m: Number(mt[2]) } : null;
}

function activeReminders(s: Settings): Reminder[] {
  if (!s.remindersOn) return [];
  return s.reminders.filter((r) => r.on && r.days.length > 0 && parseTime(r.time)).slice(0, MAX_REMINDERS);
}

export function expectedCount(s: Settings): number {
  const rem = activeReminders(s).reduce((n, r) => n + new Set(r.days).size, 0);
  return rem + (s.backupReminder ? 1 : 0);
}

// Nächster Erinnerungszeitpunkt (rein rechnerisch, ohne Systemabfrage).
export function nextReminder(s: Settings, from = new Date()): Date | null {
  let best: Date | null = null;
  for (const r of activeReminders(s)) {
    const t = parseTime(r.time)!;
    for (let add = 0; add < 8; add++) {
      const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + add, t.h, t.m, 0, 0);
      const iso = ((d.getDay() + 6) % 7) + 1;
      if (d.getTime() > from.getTime() && r.days.includes(iso)) {
        if (!best || d < best) best = d;
        break;
      }
    }
  }
  return best;
}

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Erinnerungen',
    description: 'Erinnerung an die Blutdruckmessung',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: [0, 250, 200, 250],
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  try {
    await Notifications.deleteNotificationChannelAsync(OLD_CHANNEL);
  } catch {
    // alter Channel existiert ggf. nicht
  }
}

export async function hasPermission(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function ensurePermission(): Promise<boolean> {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// Plant alles neu. Gibt die Anzahl der geplanten Benachrichtigungen zurück.
export async function rescheduleAll(s: Settings): Promise<number> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (expectedCount(s) === 0) return 0;
    if (!(await ensurePermission())) return 0;

    let n = 0;
    for (const r of activeReminders(s)) {
      const t = parseTime(r.time)!;
      for (const day of new Set(r.days)) {
        await Notifications.scheduleNotificationAsync({
          identifier: `erinnerung-${r.id}-${day}`,
          content: {
            title: 'Zeit für deine Messung',
            body: 'Das dauert nur zehn Sekunden.',
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: toExpoWeekday(day),
            hour: t.h,
            minute: t.m,
            channelId: CHANNEL,
          },
        });
        n++;
      }
    }
    if (s.backupReminder) {
      await Notifications.scheduleNotificationAsync({
        identifier: BACKUP_ID,
        content: {
          title: 'Backup erstellen',
          body: 'Sichere deine Blutdruckwerte einmal im Monat.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: 1,
          hour: 10,
          minute: 0,
          channelId: CHANNEL,
        },
      });
      n++;
    }
    return n;
  } catch {
    return -1;
  }
}

export async function scheduledCount(): Promise<number> {
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()).length;
  } catch {
    return -1;
  }
}

// Stimmt die Zahl der geplanten Benachrichtigungen nicht mit den Einstellungen überein
// (z. B. nach einem Systemeingriff), wird neu geplant.
export async function verifyAndRepair(s: Settings): Promise<void> {
  const want = expectedCount(s);
  const have = await scheduledCount();
  if (have !== want) await rescheduleAll(s);
}

export async function sendTest(seconds = 5): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Test-Erinnerung', body: 'Benachrichtigungen funktionieren.', sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: CHANNEL,
    },
  });
  return true;
}

export async function snoozeReminder(minutes = 30): Promise<void> {
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Zeit für deine Messung', body: 'Kurze Erinnerung, wie gewünscht.', sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: CHANNEL,
    },
  });
}

export function openAppSettings(): void {
  Linking.openSettings().catch(() => {});
}

export function openBatterySettings(): void {
  if (Platform.OS !== 'android') return openAppSettings();
  Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS').catch(() => openAppSettings());
}
