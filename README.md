# DruckPunkt

Blutdruck eintragen, ohne dass es nervt. DruckPunkt ist eine App (Expo / React Native), die das Eintragen auf wenige Sekunden verkürzt und mit Erinnerungen, Serien und Abzeichen beim Dranbleiben hilft.

Alle Daten bleiben lokal auf dem Gerät. Kein Konto, keine Cloud, kein Tracking, keine Werbung.

## Funktionen

- **Messen:** Eigener Zahlenblock für oben, unten und Puls. Datum und Uhrzeit setzt die App automatisch. Notiz-Chips für Stress, Kaffee, Sport und Medikamente.
- **Verlauf:** Alle Messungen nach Tagen gruppiert, farbig eingeordnet. Tippen zum Bearbeiten, nach links wischen zum Löschen.
- **Trends:** Liniendiagramm für 7, 30 und 90 Tage mit Farbzonen, Durchschnitt, Morgens/Abends-Vergleich.
- **Ziele:** Serie, Wochenziel mit Fortschrittsring, Abzeichen, Wochenrückblick.
- **Erinnerungen:** Lokale Benachrichtigungen zu frei wählbaren Zeiten, dazu „In 30 Minuten erinnern“.
- **Bericht:** PDF und CSV für den Arztbesuch.
- **Backup:** Alle Daten als eine JSON-Datei sichern (teilen oder direkt in einen Ordner wie „Downloads“ speichern) und wiederherstellen (zusammenführen oder ersetzen, mit Prüfung der Datei).

## Starten

```bash
npm install
npx expo start
```

Dann mit der Expo-Go-App auf dem Handy den QR-Code scannen. Hinweis: Benachrichtigungen funktionieren in Expo Go eingeschränkt, vollständig in einem echten Build.

## Android-APK bauen

Mit EAS Build (kostenloses Expo-Konto nötig):

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Das Profil `preview` in `eas.json` erzeugt eine installierbare `.apk`.

## Backup-Format

```json
{
  "app": "DruckPunkt",
  "version": 1,
  "exportedAt": "2026-10-07T12:00:00.000Z",
  "data": { "measurements": [], "settings": {} }
}
```

## Hinweis

DruckPunkt ersetzt keine ärztliche Beratung. Die Einordnung der Werte ist nur eine Orientierung.
