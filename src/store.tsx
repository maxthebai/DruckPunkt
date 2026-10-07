import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppData, Measurement, Settings } from './types';
import { emptyData, loadData, saveData } from './storage';
import { rescheduleAll } from './notifications';
import { mergeData } from './backup';

type Store = {
  ready: boolean;
  data: AppData;
  add: (m: Omit<Measurement, 'id'>) => void;
  update: (m: Measurement) => void;
  remove: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  replaceAll: (d: AppData) => void;
  merge: (d: AppData) => void;
  wipe: () => void;
};

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

const sortByTime = (l: Measurement[]) => [...l].sort((a, b) => b.ts.localeCompare(a.ts));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData());
  const [ready, setReady] = useState(false);
  const lastSched = useRef('');

  useEffect(() => {
    loadData().then((d) => {
      setData({ ...d, measurements: sortByTime(d.measurements) });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveData(data);
    const sig = JSON.stringify([data.settings.remindersOn, data.settings.reminderTimes, data.settings.backupReminder]);
    if (sig !== lastSched.current) {
      lastSched.current = sig;
      rescheduleAll(data.settings);
    }
  }, [data, ready]);

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
  const setSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);
  const replaceAll = useCallback((nd: AppData) => {
    setData({ ...nd, measurements: sortByTime(nd.measurements) });
  }, []);
  const merge = useCallback((nd: AppData) => {
    setData((d) => {
      const m = mergeData(d, nd);
      return { ...m, measurements: sortByTime(m.measurements) };
    });
  }, []);
  const wipe = useCallback(() => {
    setData((d) => ({ ...emptyData(), settings: d.settings }));
  }, []);

  return (
    <Ctx.Provider value={{ ready, data, add, update, remove, setSettings, replaceAll, merge, wipe }}>
      {children}
    </Ctx.Provider>
  );
}
