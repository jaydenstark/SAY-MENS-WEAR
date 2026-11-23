import seed from '../seed.mjs';

export default function handler(req, res) {
  const orderPhone = process.env.WHATSAPP_ORDER_PHONE || '233279587605';
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).json({ products: seed, orderPhone });
}
