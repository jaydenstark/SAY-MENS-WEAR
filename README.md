# Say Menswear 🇬🇭

> **Dress well. Feel confident.**  
> Handcrafted bespoke caftans, embroidered agbada sets, and signature African menswear tailored in Tema Community 8, Greater Accra, Ghana.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Location](https://img.shields.io/badge/Studio-Tema%20Community%208%2C%20Ghana-olive)](#location--studio)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Order%20%26%20Enquiries-25D366?logo=whatsapp&logoColor=white)](https://wa.me/233279587605)

---

## ✨ Highlights

- **Modern Luxury & Heritage Aesthetic**: Warm ivory alabaster surfaces, rich heritage olive tones, and warm gold accents paired with editorial serif typography (*Instrument Serif* & *Inter*).
- **Mobile UX Polish**:
  - **Slide-Over Shopping Drawer**: Desktop right slide-over drawer that adapts into an ergonomic mobile bottom sheet with drag handles.
  - **Sticky Mobile Navigation**: Frosted glass header with live gold cart counter.
  - **Ergonomic Bottom Nav Bar**: Quick-access touch bar for Collection, Search, Bespoke consultation, and Bag.
  - **Floating WhatsApp Concierge**: Instant 1-tap connection to our master tailor in Tema.
- **Direct WhatsApp Ordering**:
  - Automatically formats structured orders with SKU, sizes, quantities, and subtotal in Ghana cedis (GH₵).
  - Dedicated "Price on Enquiry" flow for bespoke commissions and custom measurements.
- **Dynamic Catalog via WhatsApp Webhook**:
  - Shop administrators can update sizes and prices on the fly via SMS/WhatsApp commands saved directly to Cloudflare R2 storage.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla ES Modules, Semantic HTML5, Custom CSS Design System (no heavy frameworks, zero runtime dependencies, instant load speeds).
- **Backend / Edge**: Cloudflare Workers / Sites with R2 bucket binding for persistent catalog caching.
- **Integrations**: Meta WhatsApp Business Cloud Webhook API.

---

## 🚀 Quick Start & Local Preview

### Prerequisites
- Node.js (v18 or newer)
- npm

### Installation & Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jaydenstark/SAY-MENS-WEAR.git
   cd SAY-MENS-WEAR
   ```

2. **Build the bundle**:
   ```bash
   npm run build
   ```

3. **Start the local preview server**:
   ```bash
   npm start
   ```

4. Open `http://127.0.0.1:4175` in your browser.

---

## 📱 Connect WhatsApp Business Webhook

To enable dynamic live pricing and size updates from WhatsApp, set the following environment variables in your Cloudflare or hosting dashboard:

| Variable | Description |
| :--- | :--- |
| `WHATSAPP_APP_SECRET` | App secret from your Meta Developer Portal |
| `WHATSAPP_VERIFY_TOKEN` | Secure verification token created during webhook configuration |
| `WHATSAPP_PHONE_ID` | Meta Phone Number ID for the receiving business account |
| `WHATSAPP_ADMIN_PHONE` | Admin WhatsApp number authorized to send catalog updates (digits with country code, e.g. `233...`) |
| `WHATSAPP_ORDER_PHONE` | Customer order receiving line (`233279587605`) |

### Webhook Endpoint
Configure your Meta WhatsApp webhook callback URL to:
```
https://YOUR-DOMAIN.com/api/whatsapp/webhook
```
Subscribe to the `messages` event.

### Updating Catalog from WhatsApp
Send a text message from the configured `WHATSAPP_ADMIN_PHONE` to the business number:

```text
UPDATE SAY-CAFTAN-GREEN
SIZES: S, M, L, XL, XXL
PRICE: 450.00
```

The worker verifies Meta’s HMAC-SHA256 signature and persists the new price and sizing in Cloudflare R2 storage instantly.

---

## 📍 Location & Studio

- **Studio**: Tema Community 8, Greater Accra, Ghana
- **Hours**: Monday – Saturday, 9:00 AM – 6:00 PM GMT
- **Phone**: [+233 27 958 7605](tel:+233279587605)
- **WhatsApp**: [Chat with Say Menswear](https://wa.me/233279587605)

---

## 📄 License

Private & Proprietary © 2026 Say Menswear. All rights reserved.
