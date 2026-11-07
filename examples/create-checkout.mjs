import { SebpayClient } from "../dist/index.js";

// Keys from your dashboard (API développeur): pk_test_ keys go to the sandbox server, pk_live_ keys to live.
const sebpay = new SebpayClient(
  process.env.SEBPAY_PUBLIC_KEY ?? "pk_test_your_key",
  process.env.SEBPAY_SECRET_KEY ?? "sk_test_your_secret",
  { baseUrl: process.env.SEBPAY_BASE_URL || undefined }, // e.g. http://localhost:8000/api/v1 for local testing
);

// One checkout session per order: your order id is the external_reference.
const orderId = `ORDER-${Date.now()}`;

const session = await sebpay.checkoutSessions.create({
  amount: 5000,
  currency: "XOF",
  redirect_url: process.env.RETURN_URL ?? "https://yoursite.com/orders/return",
  external_reference: orderId,
  callback_url: process.env.CALLBACK_URL ?? "https://yoursite.com/webhook/sebpay",
  metadata: { order_id: orderId },
});

console.log(`Redirect your customer to: ${session.checkout_url}`);
