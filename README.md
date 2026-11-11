# Selvedge Studio

A clothing storefront with a shopping bag and WhatsApp ordering. It ships with four sample products priced in Ghana cedis (GHS). Change names, categories, colors, product images and SKUs in `seed.mjs`. The WhatsApp workflow updates prices and sizes for those SKUs.

## Preview locally

Run `npm run build` and `npm start`, then open the address printed by the server. The local preview uses sample catalog data. The hosted Worker uses the Sites R2 binding `BUCKET` to persist product updates across visitors.

## Connect WhatsApp Business

Configure the following runtime variables in your hosting dashboard. Store the app secret and verification token as secrets.

| Variable | Value |
| --- | --- |
| `WHATSAPP_APP_SECRET` | App secret from the Meta developer app |
| `WHATSAPP_VERIFY_TOKEN` | A random token you choose and enter in Meta during webhook setup |
| `WHATSAPP_PHONE_ID` | Meta's phone number ID for the receiving Business number |
| `WHATSAPP_ADMIN_PHONE` | Sender's WhatsApp number, with country code and digits only. Use a separate number from the receiving number. |
| `WHATSAPP_ORDER_PHONE` | Shop number for customer orders, with country code and digits only |

Configure your Meta WhatsApp Business webhook to use `https://YOUR-HOST/api/whatsapp/webhook`, verify it with your token, and subscribe to `messages`. Meta must be able to reach the callback without a login page, so a private Sites deployment needs public hosting before this step. The webhook verifies Meta's signature and accepts catalog updates from the configured sender and Business phone ID.

Send this text from the configured admin number to your WhatsApp Business number, then refresh the storefront to see the change.

```text
UPDATE LINEN-01
SIZES: XS, S, M, L, XL
PRICE: 68.00
```

Each message replaces the sizes and price for one SKU. Available sample SKUs are `LINEN-01`, `TROUSER-01`, `JACKET-01`, and `TANK-01`. Customers choose sizes, add items to the bag, and send the order to the shop on WhatsApp for delivery and payment arrangements.

## Sample photography

The built-in ImageGen tool created a five-panel fashion contact sheet with an olive-jacket campaign photo and four flat lays on putty. The crops are in `web/assets/`.
