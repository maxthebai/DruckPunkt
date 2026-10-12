import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Measurement, MedChange, medKindLabel } from './types';
import { averages, beforeAfter, signed } from './stats';
import { fmtDate, fmtTime, dayKey } from './dates';

const COMPARE_DAYS = 14;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const byTime = (l: Measurement[]) => [...l].sort((a, b) => a.ts.localeCompare(b.ts));

// Feste Pixelgröße, damit das Diagramm in jedem PDF-Renderer gleich aussieht.
const CW = 520;
const CH = 210;

function chartSvg(list: Measurement[], meds: MedChange[]): string {
  if (list.length < 2) return '';
  const P = { l: 34, r: 10, t: 14, b: 24 };
  const t0 = new Date(list[0].ts).getTime();
  const t1 = new Date(list[list.length - 1].ts).getTime();
  const span = Math.max(1, t1 - t0);
  const lo = Math.floor((Math.min(...list.map((m) => m.dia)) - 10) / 10) * 10;
  const hi = Math.ceil((Math.max(...list.map((m) => m.sys)) + 10) / 10) * 10;
  const x = (t: number) => P.l + ((t - t0) / span) * (CW - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (CH - P.t - P.b);
  const step = hi - lo > 100 ? 20 : 10;
  let grid = '';
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    grid += `<line x1="${P.l}" x2="${CW - P.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="#ddd" stroke-width="1"/>` +
      `<text x="${P.l - 5}" y="${(y(v) + 3.5).toFixed(1)}" font-size="9" fill="#555" text-anchor="end">${v}</text>`;
  }
  const xl = [0, 0.5, 1]
    .map((f, i) => {
      const t = t0 + f * span;
      const d = new Date(t);
      const anchor = i === 0 ? 'start' : i === 2 ? 'end' : 'middle';
      return `<text x="${x(t).toFixed(1)}" y="${CH - 7}" font-size="9" fill="#555" text-anchor="${anchor}">${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}</text>`;
    })
    .join('');
  const line = (key: 'sys' | 'dia', color: string) =>
    `<polyline fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" points="${list
      .map((m) => `${x(new Date(m.ts).getTime()).toFixed(1)},${y(m[key]).toFixed(1)}`)
      .join(' ')}"/>`;
  const marks = meds
    .map((md, i) => ({ md, t: new Date(md.ts).getTime(), n: i + 1 }))
    .filter((o) => o.t >= t0 && o.t <= t1)
    .map(
      (o) =>
        `<line x1="${x(o.t).toFixed(1)}" x2="${x(o.t).toFixed(1)}" y1="${P.t}" y2="${CH - P.b}" stroke="#3f74b8" stroke-width="1.2" stroke-dasharray="4 3"/>` +
        `<text x="${(x(o.t) + 3).toFixed(1)}" y="${P.t + 9}" font-size="9" font-weight="bold" fill="#3f74b8">M${o.n}</text>`,
    )
    .join('');
  return `<svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">${grid}${xl}${marks}${line('sys', '#0f7c86')}${line('dia', '#3f74b8')}</svg>
  <div class="legend"><span style="color:#0f7c86">&#9632; Systolisch</span> <span style="color:#3f74b8">&#9632; Diastolisch</span>${marks ? ' <span style="color:#3f74b8">&#9474; M = Medikamentenänderung</span>' : ''}</div>`;
}

export function buildReportHtml(all: Measurement[], medsAll: MedChange[], periodLabel: string, cmpBase?: Measurement[]): string {
  const list = byTime(all);
  const base = cmpBase ?? list;
  const meds = [...medsAll].sort((a, b) => a.ts.localeCompare(b.ts));
  const a = averages(list);
  const rows = [...list]
    .reverse()
    .map((m) => {
      const d = new Date(m.ts);
      const extra = [...m.tags, m.note].filter(Boolean).join(', ');
      return `<tr><td>${fmtDate(d)}</td><td>${fmtTime(d)}</td><td>${m.sys}/${m.dia}</td><td>${m.pulse}</td><td>${esc(extra)}</td></tr>`;
    })
    .join('');
  const medRows = meds
    .map((md, i) => {
      const d = new Date(md.ts);
      const ba = beforeAfter(base, md.ts, COMPARE_DAYS);
      const cmp =
        ba.before.count && ba.after.count
          ? `${ba.before.sys}/${ba.before.dia} (${ba.before.count}) &rarr; ${ba.after.sys}/${ba.after.dia} (${ba.after.count}), ${signed(ba.diffSys)}/${signed(ba.diffDia)}`
          : 'zu wenige Messungen';
      const what = [medKindLabel(md.kind), md.dose].filter(Boolean).join(', ');
      return `<tr><td>M${i + 1}</td><td>${fmtDate(d)} ${fmtTime(d)}</td><td>${esc(md.name)}</td><td>${esc(what)}${md.note ? '<br/><small>' + esc(md.note) + '</small>' : ''}</td><td>${cmp}</td></tr>`;
    })
    .join('');
  const medBlock = meds.length
    ? `<h2>Medikamentenänderungen</h2>
    <table><tr><th>Nr.</th><th>Zeitpunkt</th><th>Medikament</th><th>Änderung</th><th>Ø davor &rarr; danach (${COMPARE_DAYS} Tage, Anzahl)</th></tr>${medRows}</table>`
    : '';
  const created = fmtDate(new Date());
  return `<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>
    @page { margin: 18mm 14mm; }
    body{font-family:Helvetica,Arial,sans-serif;color:#14232f;margin:0;padding:0}
    .page{width:${CW}px;margin:0 auto}
    h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 4px}
    table{border-collapse:collapse;width:100%;margin-top:8px;font-size:11px}
    th,td{border-bottom:1px solid #ddd;padding:4px 5px;text-align:left;vertical-align:top}th{background:#eef2f5}
    tr{page-break-inside:avoid}
    .box{display:inline-block;margin:8px 12px 8px 0;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:12px}
    .legend{font-size:10px;margin:2px 0 6px}
    small{color:#666}</style></head><body><div class="page">
    <h1>Blutdruck-Protokoll</h1>
    <small>Zeitraum: ${esc(periodLabel)} · erstellt am ${created} mit DruckPunkt</small>
    <div><span class="box">Messungen<br/><b>${a.count}</b></span>
    <span class="box">Durchschnitt<br/><b>${a.sys ?? '–'}/${a.dia ?? '–'}</b></span>
    <span class="box">Puls (Ø)<br/><b>${a.pulse ?? '–'}</b></span></div>
    ${chartSvg(list, meds)}
    ${medBlock}
    <h2>Messwerte</h2>
    <table><tr><th>Datum</th><th>Zeit</th><th>Systolisch/Diastolisch</th><th>Puls</th><th>Notiz</th></tr>${rows}</table>
    </div></body></html>`;
}

export async function sharePdf(list: Measurement[], meds: MedChange[], periodLabel: string, cmpBase?: Measurement[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(list, meds, periodLabel, cmpBase), width: 595, height: 842 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Bericht teilen' });
}

export async function shareCsv(list: Measurement[], meds: MedChange[]): Promise<void> {
  const q = (v: string | number) => String(v).replace(/;/g, ',').replace(/\r?\n/g, ' ');
  const head = 'Datum;Uhrzeit;Systolisch;Diastolisch;Puls;Notiz';
  const rows = byTime(list).map((m) => {
    const d = new Date(m.ts);
    return [fmtDate(d), fmtTime(d), m.sys, m.dia, m.pulse, q([...m.tags, m.note].filter(Boolean).join(', '))].join(';');
  });
  let text = [head, ...rows].join('\n');
  if (meds.length) {
    const mh = 'Datum;Uhrzeit;Medikament;Änderung;Dosis;Notiz';
    const mr = [...meds]
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .map((md) => {
        const d = new Date(md.ts);
        return [fmtDate(d), fmtTime(d), q(md.name), medKindLabel(md.kind), q(md.dose), q(md.note)].join(';');
      });
    text += '\n\nMedikamentenänderungen\n' + [mh, ...mr].join('\n');
  }
  const f = new File(Paths.cache, `druckpunkt-${dayKey(new Date())}.csv`);
  if (f.exists) f.delete();
  f.create();
  f.write('﻿' + text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  await Sharing.shareAsync(f.uri, { mimeType: 'text/csv', dialogTitle: 'CSV teilen' });
}
