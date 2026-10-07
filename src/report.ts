import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Measurement } from './types';
import { averages } from './stats';
import { classify, levelLabel } from './classify';
import { fmtDate, fmtTime, dayKey } from './dates';

function sorted(list: Measurement[]) {
  return [...list].sort((a, b) => a.ts.localeCompare(b.ts));
}

function chartSvg(list: Measurement[]): string {
  if (list.length < 2) return '';
  const W = 640;
  const H = 220;
  const P = 32;
  const lo = 40;
  const hi = Math.max(180, ...list.map((m) => m.sys + 10));
  const x = (i: number) => P + (i * (W - P * 2)) / (list.length - 1);
  const y = (v: number) => H - P - ((v - lo) * (H - P * 2)) / (hi - lo);
  const line = (key: 'sys' | 'dia', color: string) =>
    `<polyline fill="none" stroke="${color}" stroke-width="2" points="${list
      .map((m, i) => `${x(i).toFixed(1)},${y(m[key]).toFixed(1)}`)
      .join(' ')}"/>`;
  const grid = [60, 80, 100, 120, 140, 160, 180]
    .filter((v) => v <= hi)
    .map(
      (v) =>
        `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" stroke="#ddd"/><text x="4" y="${y(v) + 4}" font-size="10" fill="#666">${v}</text>`,
    )
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${grid}
    <line x1="${P}" x2="${W - P}" y1="${y(140)}" y2="${y(140)}" stroke="#cf3f3f" stroke-dasharray="4 4"/>
    ${line('sys', '#0f7c86')}${line('dia', '#3f74b8')}
    <text x="${W - 150}" y="14" font-size="11" fill="#0f7c86">oben (systolisch)</text>
    <text x="${W - 60}" y="14" font-size="11" fill="#3f74b8">unten</text></svg>`;
}

export function buildReportHtml(all: Measurement[]): string {
  const list = sorted(all);
  const a = averages(list);
  const rows = [...list]
    .reverse()
    .map((m) => {
      const d = new Date(m.ts);
      const lvl = levelLabel(classify(m.sys, m.dia));
      const extra = [...m.tags, m.note].filter(Boolean).join(', ');
      return `<tr><td>${fmtDate(d)}</td><td>${fmtTime(d)}</td><td>${m.sys}/${m.dia}</td><td>${m.pulse}</td><td>${lvl}</td><td>${extra.replace(/</g, '&lt;')}</td></tr>`;
    })
    .join('');
  const range = list.length ? `${fmtDate(new Date(list[0].ts))} bis ${fmtDate(new Date(list[list.length - 1].ts))}` : '';
  return `<html><head><meta charset="utf-8"/><style>
    body{font-family:Helvetica,Arial,sans-serif;color:#14232f;padding:24px}
    h1{margin:0 0 4px}table{border-collapse:collapse;width:100%;margin-top:12px;font-size:12px}
    th,td{border-bottom:1px solid #ddd;padding:5px 6px;text-align:left}th{background:#eef2f5}
    .box{display:inline-block;margin:8px 16px 8px 0;padding:8px 12px;border:1px solid #ddd;border-radius:6px}
    small{color:#666}</style></head><body>
    <h1>Blutdruck-Protokoll</h1><small>Erstellt am ${fmtDate(new Date())} mit DruckPunkt · Zeitraum ${range}</small>
    <div><span class="box">Messungen<br/><b>${a.count}</b></span>
    <span class="box">Durchschnitt<br/><b>${a.sys ?? '-'}/${a.dia ?? '-'}</b></span>
    <span class="box">Puls (Ø)<br/><b>${a.pulse ?? '-'}</b></span></div>
    ${chartSvg(list)}
    <table><tr><th>Datum</th><th>Zeit</th><th>Blutdruck</th><th>Puls</th><th>Einordnung</th><th>Notiz</th></tr>${rows}</table>
    <p><small>Die Einordnung ist nur eine Orientierung und ersetzt keine ärztliche Beratung.</small></p>
    </body></html>`;
}

export async function sharePdf(list: Measurement[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(list) });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Bericht teilen' });
}

export async function shareCsv(list: Measurement[]): Promise<void> {
  const head = 'Datum;Uhrzeit;Oben;Unten;Puls;Einordnung;Notiz';
  const rows = sorted(list).map((m) => {
    const d = new Date(m.ts);
    const extra = [...m.tags, m.note].filter(Boolean).join(', ').replace(/;/g, ',').replace(/\n/g, ' ');
    return [fmtDate(d), fmtTime(d), m.sys, m.dia, m.pulse, levelLabel(classify(m.sys, m.dia)), extra].join(';');
  });
  const f = new File(Paths.cache, `druckpunkt-${dayKey(new Date())}.csv`);
  if (f.exists) f.delete();
  f.create();
  f.write('\uFEFF' + [head, ...rows].join('\n'));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  await Sharing.shareAsync(f.uri, { mimeType: 'text/csv', dialogTitle: 'CSV teilen' });
}
