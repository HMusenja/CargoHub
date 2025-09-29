## CargoHub  
Smart Cargo & Package Shipping Platform (MERN + Vite + Tailwind v3)

---

## Overview
CargoHub is a full-stack web application that simplifies cargo and package shipping from Europe to Africa.  
It helps customers get instant quotes, book shipments, pay online, and track deliveries in real time.  
For staff and drivers, it provides operational dashboards for intake, scanning, manifests, and proof of delivery.  

It is designed to demonstrate real-world logistics flows like QR-based labels, pickup scheduling, multi-role dashboards, and analytics.

---

## Core Features
- **Quotes & Bookings**: Instant rate calculation (zones, weight, volume, surcharges), shipment creation with pickup/drop-off options.  
- **Payments**: Online checkout with Stripe (EU) and support for Flutterwave/Paystack (Africa).  
- **Labels & QR Codes**: Auto-generated PDF labels with QR/barcodes for tracking.  
- **Tracking**: Customer-facing timeline (Booked → Picked Up → In Transit → Delivered).  
- **Notifications**: Email confirmations (SMS/WhatsApp planned).  
- **Dashboards**:  
  - Customer: My shipments, tracking.  
  - Agent: Intake queue, scan/update status, manifests.  
  - Driver: Assigned pickups & deliveries, proof of delivery.  
  - Admin: Shipments, rates, branches, reports.  
- **Reports**: Basic summaries of shipments, revenue, and delivery performance.  

---

## Optional Plus Features
- Multi-language support (EN/FR for West/Central Africa).  
- COD (Cash on Delivery) workflow with settlements.  
- Advanced analytics: revenue by route, on-time %, branch performance.  
- Customer wallet & loyalty points.  
- E-commerce integrations (Shopify, WooCommerce) via API/webhooks.  
- Dispute/claims module for lost/damaged parcels.  

---

## Tech Stack

### Frontend
- React + Vite  
- Tailwind CSS v3  
- React Router  
- React Hook Form + Zod (validation)  
- Axios (API calls)  
- React Hot Toast (notifications)  
- QRCode.react (QR labels)  
- Lucide Icons (icons)  

### Backend
- Node.js + Express  
- MongoDB + Mongoose  
- JWT Auth + bcrypt (authentication)  
- Stripe (payments)  
- Nodemailer (emails)  
- Multer (file uploads for POD/signatures)  
- PDFKit + qrcode (label generation)  
- Zod (validation)  

---

## Demo Workflow (Simulating a Shipment)

1. **Customer gets a quote**  
   - Opens Quote page, enters origin/destination + weight/dimensions.  
   - System calculates chargeable weight and returns price + ETA.  

2. **Customer books a shipment**  
   - Logs in or registers.  
   - Fills out sender/receiver details, contents, insurance.  
   - Selects pickup scheduling or drop-off branch.  

3. **Payment & label generation**  
   - Customer pays via Stripe checkout.  
   - System confirms payment, generates shipment reference + PDF label with QR code.  

4. **Operational scanning**  
   - Agent scans QR code at intake.  
   - Status updates as parcel moves: Bagged → Loaded → In Transit → Arrived → Out for Delivery.  

5. **Driver delivery**  
   - Driver dashboard shows assigned pickups/deliveries.  
   - Captures proof of delivery (name/signature/photo).  

6. **Tracking & notifications**  
   - Customer checks tracking page (/track/:ref) for timeline updates.  
   - Email notifications sent for key milestones (Booked, Paid, Delivered).  

7. **Admin oversight**  
   - Admin dashboard shows shipment queue, rate management, branches, and simple reports.  

---

## Roadmap
- [x] Project setup (MERN + Tailwind v3)  
- [ ] Instant quote API + frontend integration  
- [ ] Shipment booking flow  
- [ ] Stripe payments + label generation  
- [ ] Tracking timeline with scan events  
- [ ] Role-based dashboards (Customer, Agent, Driver, Admin)  
- [ ] Notifications via email (SMS/WhatsApp later)  
- [ ] Reports & analytics  

---

## License
MIT License © 2025 CargoHub
 CargoHub
