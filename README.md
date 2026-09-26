# BingeShield

A Chrome Manifest V3 extension for blocking domains and hostname patterns.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

The extension settings are available from the extension options page. The PIN protects configuration changes, and history/notifications are stored locally on the computer.

## Features

- Block exact domains, subdomains, and wildcard hostname patterns.
- Configure global blocking schedules by day and time.
- Protect configuration changes with a PIN.
- Keep a local history of blocked navigation attempts.
- Show local desktop notifications when a page is blocked.
- Export and import the extension configuration as JSON.
- Display Spanish when Chrome's UI language is Spanish; otherwise display English.

## Tests

With Node.js installed, run:

```bash
node tests/shared.test.js
```
