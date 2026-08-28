# SIIFMART Enterprise WMS & POS

> **Retail & Warehouse Operating System**
> Unified Multi-Platform Application: **Web App** • **PC Desktop App** • **Android Mobile App**

---

## 🎯 Supported Platform Targets

### 1. 🌐 Web App (Vite + React SPA / PWA)
- **Development Server**:
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Local Preview**:
  ```bash
  npm run preview
  ```

---

### 2. 🖥️ PC Desktop App (Electron)
Cross-platform desktop application for Cashier POS stations, Manager HQ, and Warehouse terminals.

- **Desktop Development Mode**:
  ```bash
  npm run electron:dev
  ```
- **Build All Desktop Installers**:
  ```bash
  npm run electron:build
  ```
- **Platform-Specific Builds**:
  - **macOS** (`.dmg`, `.zip` with Apple Silicon & Intel support):
    ```bash
    npm run electron:build:mac
    ```
  - **Windows** (NSIS installer & portable `.exe`):
    ```bash
    npm run electron:build:win
    ```
  - **Linux** (`.AppImage`, `.deb`, `.rpm`):
    ```bash
    npm run electron:build:linux
    ```

---

### 3. 📱 Android Mobile App (Capacitor)
Mobile & handheld scanner app for warehouse picking, packing, receiving, dispatch, and mobile POS.

- **Sync Web Assets to Android**:
  ```bash
  npm run android:sync
  ```
- **Build Android APK**:
  ```bash
  npm run android:build
  ```
- **Open in Android Studio**:
  ```bash
  npm run android:open
  ```

---

## 🧪 Testing & Code Quality

- **Run Unit Tests**:
  ```bash
  npm test
  ```
- **Type Checking**:
  ```bash
  npx tsc --noEmit
  ```
- **File Size Verification (Strict 500-line limit)**:
  ```bash
  npm run lint:size
  ```

---

## 📁 Repository Structure

```
├── android/          → Official Capacitor Android Project
├── components/       → Reusable UI & Feature Components
├── contexts/         → Global Central Store & Data Contexts
├── electron/         → Native Electron Main, Preload & Printer Process
├── hooks/            → React Custom Mutation & Query Hooks
├── migrations/       → Supabase SQL Schema Migrations
├── pages/            → Lazy-loaded Page Routes
├── public/           → Vector SVGs, Web Icons, Favicons & Manifest
├── schemas/          → Database & Validation Schema Registry
├── services/         → Supabase & Offline Service Layer
├── tests/            → Vitest Unit & Playwright E2E Tests
├── types/            → Strict TypeScript Types & Interfaces
└── utils/            → Shared Business Logic, Role & Formatting Utils
```
