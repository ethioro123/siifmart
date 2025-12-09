# Automated Testing Strategy for SIIFMART

## 1. Overview
To ensure the reliability and stability of SIIFMART, we will implement a two-tiered automated testing strategy:
1.  **Unit & Integration Testing**: Using **Vitest** and **React Testing Library**.
2.  **End-to-End (E2E) Testing**: Using **Playwright**.

## 2. Technology Stack

### Unit Testing: Vitest
*   **Why?** It is native to Vite (our build tool), offering faster execution and shared configuration compared to Jest.
*   **Scope:**
    *   **Utility Functions:** Testing complex logic in `utils/` (e.g., calculations, formatting).
    *   **Services:** Testing permission logic in `services/permissions.service.ts` (CRITICAL).
    *   **Components:** Testing individual UI components in isolation using `testing-library/react`.

### E2E Testing: Playwright
*   **Why?** Industry standard, reliable, supports multiple browsers, and handles modern web app features (waiting for elements, network interception) better than Cypress.
*   **Scope:**
    *   **Critical Flows:** Login, POS Checkout, PO Approval, Inventory Transfer.
    *   **Role-Based Access:** Verifying that a Store Manager cannot access Admin pages.

## 3. Implementation Plan

### Phase 1: Infrastructure Setup
- [ ] Install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.
- [ ] Configure `vite.config.ts` for testing.
- [ ] Install `@playwright/test`.
- [ ] Configure `playwright.config.ts`.
- [ ] Add test scripts to `package.json`.

### Phase 2: Critical Unit Tests
- [ ] **Permissions:** Test `hasPermission`, `checkSoDViolations`, and `canApprove` in `services/permissions.service.ts`.
- [ ] **Calculations:** Test metric calculations in `utils/metrics.ts`.
- [ ] **Validation:** Test input validation logic.

### Phase 3: Critical E2E Flows
- [ ] **Authentication:** Login with different roles.
- [ ] **POS:** Complete a sale transaction.
- [ ] **Inventory:** Receive items and verify stock update.

## 4. Running Tests
*   `npm run test`: Run unit tests.
*   `npm run test:ui`: Run unit tests with UI.
*   `npm run test:e2e`: Run Playwright E2E tests.

## 5. CI/CD Integration
*   Tests should run automatically on every Pull Request (PR) to the `main` branch.
