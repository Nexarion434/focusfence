# Datenschutzerklärung von FocusFence

_Gültig ab: 13. November 2026_

_Dies ist eine Übersetzung. Bei Abweichungen ist die [englische Fassung](../privacy.html) maßgeblich._

FocusFence („die Erweiterung“) ist eine Chrome-Erweiterung, die Websites Ihrer Wahl sperrt, damit Sie konzentriert bleiben. Sie ist so gebaut, dass sie vollständig auf Ihrem Gerät arbeitet. Diese Erklärung beschreibt, was die Erweiterung speichert, was sie (sehr wenig) über das Netzwerk sendet und welche Wahlmöglichkeiten Sie haben.

## Kurz gesagt

- **Kein Konto, keine Analyse, kein Tracking, keine Werbung.** Wir betreiben keinen Server und erhalten Ihre Daten nie.
- **Ihre Sperrliste, Einstellungen und Statistik bleiben auf Ihrem Gerät**, im lokalen Erweiterungsspeicher von Chrome.
- **Die Erweiterung liest keine Seiteninhalte.** Gesperrt wird von der in Chrome eingebauten `declarativeNetRequest`-Engine, die Adressen mit Ihrer Liste abgleicht, ohne Ihr Surfverhalten der Erweiterung offenzulegen.
- **Die einzige Netzwerkkommunikation erfolgt mit ExtensionPay**, und nur, wenn Sie auf Pro upgraden (Details unten).

## Was auf Ihrem Gerät gespeichert wird

| Daten | Zweck | Ort |
|---|---|---|
| Ihre Sperrliste (Domains, Pfade, Stichwörter) | Um diese Websites zu sperren | `chrome.storage.local` |
| Einstellungen (Ein/Aus, Zeitplan, Dauer der Fokus-Sitzungen, Nachricht der Sperrseite) | Um Ihre Vorlieben anzuwenden | `chrome.storage.local` |
| Timer für Fokus-Sitzungen und Strikt-Modus | Damit Sitzungen einen Browser-Neustart überstehen | `chrome.storage.local` |
| Anzahl gesperrter Aufrufe pro gesperrter Website und Tag (letzte 90 Tage) | Für Ihre Statistik und die „gewonnene Zeit“ | `chrome.storage.local` |
| Passwortschutz: ein gesalzener PBKDF2-SHA-256-Hash (nie das Passwort selbst) | Um Ihre Einstellungen zu schützen | `chrome.storage.local` |
| „Entsperrt“-Markierung für 15 Minuten nach Eingabe des Passworts | Komfort | `chrome.storage.session` (wird beim Schließen des Browsers gelöscht) |
| Anzahl falscher Passworteingaben (um das Raten zu bremsen) | Sicherheit | `chrome.storage.session` (wird beim Schließen des Browsers gelöscht) |

Die Statistik erfasst nur **gesperrte** Aufrufe, benannt nach der passenden Regel (zum Beispiel `reddit.com`). FocusFence führt keinen Verlauf der Websites, die Sie besuchen.

Sie können die Statistik jederzeit löschen (Einstellungen → Statistik → Statistik löschen). Beim Deinstallieren der Erweiterung werden alle oben genannten Daten gelöscht.

## Was Ihr Gerät verlässt

**Nichts, es sei denn, Sie entscheiden sich für Pro.**

Zahlungen werden von [ExtensionPay](https://extensionpay.com) abgewickelt, einem Zahlungsdienst für Browser-Erweiterungen, der Stripe für Kartenzahlungen nutzt. Wenn Sie auf eine Upgrade- oder „Kauf wiederherstellen“-Schaltfläche klicken:

1. Die Erweiterung fordert bei ExtensionPay eine zufällige Kennung (einen API-Schlüssel) für Ihre Installation an und öffnet die Bezahlseite von ExtensionPay in einem neuen Tab.
2. Sie geben Ihre Zahlungsdaten und E-Mail-Adresse **direkt auf den Seiten von ExtensionPay/Stripe** ein. FocusFence sieht oder speichert Ihre Kartendaten nie.
3. Danach sendet die Erweiterung diese Kennung regelmäßig an ExtensionPay (beim Browserstart, etwa alle 12 Stunden und beim Öffnen der Einstellungen), um zu prüfen, ob Ihr Abo aktiv ist. Surfdaten, Sperrliste oder Statistik werden nie gesendet.

Die ExtensionPay-Bibliothek speichert die Kennung, das Installationsdatum und Ihren Abo-Status in `chrome.storage.sync`. Ist Chrome Sync aktiviert, synchronisiert Chrome diese Daten mit Ihrem Google-Konto, damit Ihr Kauf auf Ihren anderen Computern verfügbar ist. Für die Daten, die Sie ExtensionPay geben, gilt dessen eigene Datenschutzerklärung: <https://extensionpay.com/privacy>.

## Berechtigungen und wofür sie nötig sind

- **storage**: Sperrliste, Einstellungen und Statistik lokal speichern.
- **declarativeNetRequest**: Chrome Aufrufe von Websites auf Ihrer Liste sperren oder umleiten lassen.
- **alarms**: Zeitpläne, Fokus-Timer und Strikt-Modus-Timer ausführen.
- **activeTab**: die Adresse des aktuellen Tabs nur lesen, wenn Sie das FocusFence-Fenster öffnen, damit Sie ihn mit einem Klick sperren können.
- **scripting**: für Pfad-Regeln (z. B. `youtube.com/shorts`) ein kleines Skript nur auf dieser Website registrieren, damit auch die Navigation innerhalb der Website gesperrt wird. Es meldet FocusFence nur die Seitenadresse; es liest oder verändert keine Seiteninhalte.
- **Optionaler Website-Zugriff**: wird Website für Website angefragt, wenn Sie die Website hinzufügen, damit FocusFence seine Sperrseite statt der Chrome-Fehlerseite zeigen kann. Lehnen Sie ab, bleibt die Website trotzdem gesperrt.
- **extensionpay.com**: Das ExtensionPay-Skript läuft nur auf extensionpay.com, um eine abgeschlossene Zahlung zu bestätigen.

## Kinder

FocusFence richtet sich nicht an Kinder unter 13 Jahren und erhebt wissentlich von niemandem personenbezogene Daten.

## Verkauf und Weitergabe von Daten

Wir verkaufen, vermieten oder teilen Ihre Daten nicht. Wir nutzen oder übertragen sie nicht für Zwecke, die nichts mit dem einzigen Zweck der Erweiterung zu tun haben, und nicht zur Prüfung der Kreditwürdigkeit oder Kreditvergabe.

## Open Source

FocusFence ist freie Software unter der GNU Affero General Public License v3 (oder später). Jede Aussage dieser Erklärung können Sie im Quellcode prüfen: <https://github.com/Nexarion434/focusfence>.

## Änderungen

Ändert sich diese Erklärung, wird die neue Fassung unter derselben Adresse mit neuem Gültigkeitsdatum veröffentlicht. Wesentliche Änderungen werden in den Versionshinweisen der Erweiterung genannt.

## Kontakt

Fragen zum Datenschutz: **{{CONTACT}}**
