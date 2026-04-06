# SBT2

A modern, platform-agnostic PWA for controlling Storz & Bickel vaporizers via Web Bluetooth.

## 🚀 Live App

**[Open SBT2](https://0022111.github.io/SBT2/)** — Works on Android Chrome, Desktop Chrome/Edge

Just click the link, allow Bluetooth access, and connect your device.

## Features

- **Battery Monitoring** — Real-time battery level with charging status
- **Last Device Latching** — App remembers your last connected device and battery level
- **Temperature Control** — Adjustable target temperature with live feedback
- **Heater Modes** — Off, Heat, Boost, Super Boost
- **Device Settings** — Units (C/F), auto-shutdown timer, eco charging modes
- **Installable** — Add to home screen for a native app experience
- **Offline Ready** — PWA with service worker

## Device Support

- **Veazy/Venty** — Full support (primary device)
- **Volcano** — Supported (temperature, heater, pump control)
- **Crafty** — Supported (temperature, heater, battery)

## Local Development

```bash
cd app
npm install
npm run dev
```

Then open `http://localhost:5173` in Chrome.

## Building

```bash
cd app
npm run build
```

Deploying to `main` branch auto-deploys to GitHub Pages.

## Tech Stack

- React + TypeScript + Vite
- Material UI for polished dark theme
- Web Bluetooth API for device communication
- PWA with service worker

## Reference

Built from [reactive-volcano-app](https://github.com/firsttris/reactive-volcano-app) architecture and BLE protocol knowledge.
