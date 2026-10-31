# DOFU Furniture & Interior Design — Business Management System

A bespoke, luxury business management system tailored specifically for **DOFU Furniture & Interior Design** to eliminate paper records, lost receipts, and fragmented WhatsApp orders.

Built with **React 19**, **Vite**, **Firebase Cloud Firestore SDK**, **Lucide Icons**, and a handcrafted **Vanilla CSS Luxury Design System** inspired by deep charcoal, natural African hardwoods (Mvule, Teak, Mahogany), and champagne brass accents.

## 🔐 Staff Authentication & Portal Access

The system is protected with a luxury staff portal authentication wall:
- **Username / Staff Name**: `DOFU`
- **Password**: `DOFU5060`
- **Session**: Automatically remembered on the device until "Sign Out" is clicked in the sidebar.

---

## 🌟 Key Features & Modules

### 1. 📊 Executive Dashboard & Real-Time Analytics
- **Collected Revenue & Receivables Due**: Instantly see total client deposits, paid balances, and outstanding amounts.
- **Active Workshop Production**: Live count of furniture pieces currently being crafted by carpenters.
- **Active Interior Design Projects**: Sites and rooms currently in fit-out stage.
- **Zero-Data Guided Onboarding**: Starts clean with 0 mock/demo records so you can begin entering your real clients and orders immediately.

### 2. 🪑 Custom Furniture Orders & Production Pipeline
- Track custom bespoke furniture through 6 production stages:
  1. *Order Placed / Draft*
  2. *Carpentry & Timber Sizing*
  3. *Upholstery, Cushioning & Finishing*
  4. *Quality Check (QC Inspection)*
  5. *Ready for Dispatch / Showroom*
  6. *Delivered & Installed*
- Record exact **dimensions (L × W × H)**, **timber species** (Mvule, Teak, African Mahogany, Oak, Walnut), **fabric swatches**, wood stain finish, and assigned lead carpenter.
- **🖨️ Workshop Job Card & Cutting Sheet**: 1-click printable physical spec sheet for artisans on the workshop floor, complete with cutting checklists and quality sign-off boxes.

### 3. 📐 Interior Design Projects & Space Planning
- Track residential, villa, penthouse, and commercial interior fit-outs.
- Manage room-by-room scopes (Living Room, Dining, Master Suite, Walk-in Closet, etc.).
- Milestone checklist: Site measurements, Moodboard & Color palette, 3D Renders, Workshop Joinery, On-site Installation, and Handover.
- Contract value, client deposits, and balance tracking.

### 4. 👥 Client Relationship Management (CRM)
- Centralized client database: Contact person, Phone numbers, Delivery / Site addresses, Client classification (Residential, Commercial, Hotel/Hospitality, Architect/Contractor).
- Client taste notes and wood preferences.
- Linked history of all furniture orders and invoices per client.

### 5. 📑 Quotes, Invoices & Receipt Billing
- Create professional **Proforma Quotations** and **Tax/Commercial Invoices**.
- Itemized dynamic line items with automated subtotal, discounts, and tax (VAT) calculations.
- Record partial deposits (e.g., 50% deposit, 30% progress, 20% handover balance).
- Payment method tags: *Bank Wire (CRDB/NMB)*, *Mobile Money (M-Pesa/TigoPesa)*, *Cash*, *Card*.
- **🖨️ PDF & Print Ready**: Luxury printable layout with DOFU branding, bank details, terms, and client signature lines.

### 6. 📦 Materials & Inventory Stock Control
- Manage hardwood timber boards, luxury fabric rolls, hardware & drawer slides, varnishes/stains, and finished showroom stock.
- Automated **Low Stock Warnings** when quantities drop below minimum alert thresholds.
- Quick **+1 / -1 stock adjuster** for busy storekeepers.

### 7. 🧾 Workshop Operational Expenses
- Log timber purchases, artisan daily wages, transport logistics, workshop rent, generator fuel, and machinery maintenance.
- Track true net operating profit.

---

## ☁️ Firebase Cloud Database Integration

This application connects to **Google Firebase Cloud Firestore** for real-time cloud persistence across all staff devices.

### How to Connect Your Firebase Project:
1. In the application header or sidebar, click **"Connect Firebase"** (or go to **Settings & Cloud**).
2. Either paste your Firebase Web App configuration object from the Firebase Console (the system has an auto-parser that fills all fields automatically), or enter your `projectId` and `apiKey`.
3. Click **"Test Connection"** to verify Firestore connectivity.
4. Click **"Save & Connect Firebase"**.
5. Once connected, click **"Upload Local Data to Cloud"** to sync any records created while offline directly into Firestore!

### Recommended Firestore Security Rules:
In your Firebase Console under **Firestore Database** > **Rules**, use:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // In production: request.auth != null;
    }
  }
}
```

---

## 🚀 Running Locally

```bash
# Start development server
npm run dev

# Build production bundle
npm run build
```

- Development server runs at: `http://localhost:5173`
