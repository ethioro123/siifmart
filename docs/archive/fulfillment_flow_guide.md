# Warehouse Fulfillment Flow Guide

This guide outlines the complete warehouse fulfillment flow, from creating a Purchase Order (PO) to completing Putaway jobs.

## Prerequisites
Ensure you have the following data set up:
1.  **Site:** A valid Warehouse site (e.g., "Main Warehouse").
2.  **Supplier:** A valid Supplier (e.g., "Acme Corp").
3.  **Product:** Existing products in the Inventory (e.g., "Soda Can").

## Step 1: Create Purchase Order (PO)
1.  Navigate to **Procurement** > **Orders**.
2.  Click **Create Order**.
3.  Select a **Supplier**.
4.  **Important:** Use the **Existing Product** tab/toggle to select products from your inventory.
    *   *Note: "Custom Items" may not persist correctly if they don't exist in the product database.*
5.  Enter Quantity and Price.
6.  Click **Add** and then **Issue Order**.
7.  If you are a Super Admin, click **Approve PO** (or "Issue Order" might auto-approve depending on settings).

## Step 2: Receive Stock
1.  Navigate to **WMS Operations** (`/wms-ops`).
2.  Go to the **RECEIVE** tab.
3.  Locate your Approved PO.
4.  Click on the PO card.
5.  **Quality Check:**
    *   Enter Temperature (e.g., "-4").
    *   Click **Pass & Continue**.
6.  **Confirm Quantities:**
    *   Verify the received quantity matches the ordered quantity.
    *   Click **Confirm Quantities & Create Putaway Jobs**.
7.  Click **Finish**.

## Step 3: Putaway
1.  Switch to the **PUTAWAY** tab in WMS Operations.
2.  You will see a list of pending putaway jobs (one for each line item received).
3.  Click on a job to start.
4.  **Execute Job:**
    *   **Scan Product:** Scan the barcode or manually enter the Product ID.
    *   **Scan Bin:** Scan the target Bin location (e.g., "A-01-01").
    *   Click **Confirm Putaway**.
5.  **Auto-Progression:**
    *   The system will automatically load the next pending job for the same PO.
    *   Repeat until all jobs are complete.

## Troubleshooting
*   **PO Not Visible:** Ensure you are viewing the correct Site. Switch sites using the top-right dropdown.
*   **"Custom Item" Error:** If a PO fails to save, ensure you are using existing products, not custom text entries.
