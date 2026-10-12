import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppData, MedChange, Measurement, Settings } from './types';
import { emptyData, loadData, saveData } from './storage';
import { AppState } from 'react-native';
import { rescheduleAll, verifyAndRepair } from './notifications';
import { mergeData } from './backup';

type Store = {
  ready: boolean;
  data: AppData;
  add: (m: Omit<Measurement, 'id'>) => void;
  update: (m: Measurement) => void;
  remove: (id: string) => void;
  addMed: (m: Omit<MedChange, 'id'>) => void;
  updateMed: (m: MedChange) => void;
  removeMed: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  replaceAll: (d: AppData) => void;
  merge: (d: AppData) => void;
  wipe: () => void;
};

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

const sortByTime = <T extends { ts: string }>(l: T[]) => [...l].sort((a, b) => b.ts.localeCompare(a.ts));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData());
  const [ready, setReady] = useState(false);
  const lastSched = useRef('');

  useEffect(() => {
    loadData().then((d) => {
      setData({ ...d, measurements: sortByTime(d.measurements), medChanges: sortByTime(d.medChanges) });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveData(data);
    const sig = JSON.stringify([data.settings.remindersOn, data.settings.reminders, data.settings.backupReminder]);
    if (sig !== lastSched.current) {
      lastSched.current = sig;
      rescheduleAll(data.settings);
    }
  }, [data, ready]);

  // Beim Zurückkehren in die App prüfen, ob alle Erinnerungen noch geplant sind.
  const settingsRef = useRef(data.settings);
  settingsRef.current = data.settings;
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') verifyAndRepair(settingsRef.current);
    });
    return () => sub.remove();
  }, [ready]);

  const add = useCallback((m: Omit<Measurement, 'id'>) => {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    setData((d) => ({ ...d, measurements: sortByTime([...d.measurements, { ...m, id }]) }));
  }, []);
  const update = useCallback((m: Measurement) => {
    setData((d) => ({ ...d, measurements: sortByTime(d.measurements.map((x) => (x.id === m.id ? m : x))) }));
  }, []);
  const remove = useCallback((id: string) => {
    setData((d) => ({ ...d, measurements: d.measurements.filter((x) => x.id !== id) }));
  }, []);
  const addMed = useCallback((m: Omit<MedChange, 'id'>) => {
    const id = `med-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    setData((d) => ({ ...d, medChanges: sortByTime([...d.medChanges, { ...m, id }]) }));
  }, []);
  const updateMed = useCallback((m: MedChange) => {
    setData((d) => ({ ...d, medChanges: sortByTime(d.medChanges.map((x) => (x.id === m.id ? m : x))) }));
  }, []);
  const removeMed = useCallback((id: string) => {
    setData((d) => ({ ...d, medChanges: d.medChanges.filter((x) => x.id !== id) }));
  }, []);
  const setSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);
  const replaceAll = useCallback((nd: AppData) => {
    setData({ ...nd, measurements: sortByTime(nd.measurements), medChanges: sortByTime(nd.medChanges) });
  }, []);
  const merge = useCallback((nd: AppData) => {
    setData((d) => {
      const m = mergeData(d, nd);
      return { ...m, measurements: sortByTime(m.measurements), medChanges: sortByTime(m.medChanges) };
    });
  }, []);
  const wipe = useCallback(() => {
    setData((d) => ({ ...emptyData(), settings: d.settings }));
  }, []);

  return (
    <Ctx.Provider value={{ ready, data, add, update, remove, addMed, updateMed, removeMed, setSettings, replaceAll, merge, wipe }}>
      {children}
    </Ctx.Provider>
  );
}
