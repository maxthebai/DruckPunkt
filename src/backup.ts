import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { AppData, BACKUP_VERSION, BackupFile } from './types';
import { sanitize } from './storage';
import { dayKey } from './dates';

export function buildBackup(data: AppData): BackupFile {
  return { app: 'DruckPunkt', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
}

export function backupFileName(): string {
  return `druckpunkt-backup-${dayKey(new Date())}.json`;
}

function writeTemp(name: string, content: string): File {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(content);
  return f;
}

// Backup über das Teilen-Menü (Downloads, Google Drive, E-Mail ...).
export async function shareBackup(data: AppData): Promise<void> {
  const f = writeTemp(backupFileName(), JSON.stringify(buildBackup(data), null, 2));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Backup speichern' });
}

// Backup direkt in einen gewählten Ordner schreiben (z. B. Downloads).
export async function saveBackupToFolder(data: AppData): Promise<string> {
  const dir = await Directory.pickDirectoryAsync();
  const f = dir.createFile(backupFileName(), 'application/json');
  f.write(JSON.stringify(buildBackup(data), null, 2));
  return f.name;
}

export type RestorePreview = {
  data: AppData;
  count: number;
  from: string | null;
  to: string | null;
};

export async function pickBackup(): Promise<RestorePreview | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const file = new File(res.assets[0].uri);
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist kein gültiges Backup (kein lesbares JSON).');
  }
  if (!parsed || parsed.app !== 'DruckPunkt' || typeof parsed.version !== 'number') {
    throw new Error('Diese Datei stammt nicht von DruckPunkt.');
  }
  if (parsed.version > BACKUP_VERSION) {
    throw new Error('Das Backup stammt aus einer neueren App-Version. Bitte aktualisiere die App.');
  }
  const data = sanitize(parsed.data);
  if (!data) throw new Error('Das Backup ist beschädigt. Es wurde nichts verändert.');
  const times = data.measurements.map((m) => m.ts).sort();
  return { data, count: data.measurements.length, from: times[0] ?? null, to: times[times.length - 1] ?? null };
}

export function mergeData(current: AppData, incoming: AppData): AppData {
  const seen = new Set(current.measurements.map((m) => m.ts));
  const add = incoming.measurements.filter((m) => !seen.has(m.ts));
  return {
    ...current,
    measurements: [...current.measurements, ...add].sort((a, b) => a.ts.localeCompare(b.ts)),
  };
}
