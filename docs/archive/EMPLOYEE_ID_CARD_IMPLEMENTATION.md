# Employee ID Card Generator Implementation

## Overview
Implemented a modern, cyber-themed Employee ID Card generator within the HR module. This feature allows HR managers and administrators to generate and print professional ID cards for employees directly from their profile.

## Key Features

### 1. Modern ID Card Design
- **Cyber Aesthetic**: Dark theme with neon accents matching the application's design system.
- **Dynamic Role Colors**: Accent colors change based on the employee's role (e.g., Gold for Super Admin, Purple for Admin, Blue for Managers).
- **Glassmorphism Effects**: Used for a premium, high-tech look.

### 2. Comprehensive Information Display
- **Employee Details**: Displays Name, Role, Simplified Employee Code (or ID), Department, and Site Code (or ID).
- **Visual Identification**: Prominently displays the employee's avatar.
- **QR Code**: Automatically generates a QR code containing the employee's essential data (ID, Name, Role, Site) for quick scanning and verification.

### 3. Print Functionality
- **Dedicated Print Button**: Opens a print-optimized window.
- **Print Styling**: Custom CSS (`@media print`) ensures the card prints correctly with background colors and proper dimensions (standard ID card size: 3.375" x 2.125").
- **Clean Output**: Hides UI elements (buttons, close icons) during printing.

### 4. Integration with Employee Profile
- **Seamless Access**: Added a "Generate ID" button within the "Staff Profile" modal in the Employees directory.
- **Modal Interface**: The ID card preview opens in a focused modal overlay.

## Technical Implementation

### Components
- **`components/EmployeeIDCard.tsx`**: The core component responsible for rendering the card and handling the print logic.
  - Uses `qrcode` library for QR generation.
  - Uses `lucide-react` for icons.
  - Implements `window.open` and `document.write` for the print window to ensure style isolation and correct rendering.

### Page Integration
- **`pages/Employees.tsx`**:
  - Added `idCardEmployee` state to manage the ID card modal visibility.
  - Integrated the "Generate ID" button in the employee profile header.
  - Conditionally renders the `EmployeeIDCard` component when an employee is selected for ID generation.

## Usage
1. Navigate to the **Employees** page.
2. Click on an employee card to open their **Staff Profile**.
3. In the profile header, click the **Generate ID** button (Credit Card icon).
4. Review the generated ID card in the preview modal.
5. Click **Print ID Card** to open the print dialog.

## Dependencies
- `qrcode`: For generating the QR code.
- `lucide-react`: For icons.
- `tailwindcss`: For styling.

## Future Enhancements
- **Customizable Templates**: Allow choosing from different card layouts.
- **Batch Printing**: Select multiple employees and print their IDs in one go.
- **NFC Integration**: Placeholder for writing to NFC tags if hardware support is added.
