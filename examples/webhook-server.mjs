// A minimal Express server for both ends of a hosted checkout:
//   POST /webhook/sebpay  — the signed notification Sebpay sends to your callback_url;
//   GET  /orders/return   — your redirect_url, where the customer lands with ?checkout_session_id=…
// npm install express, then: node examples/webhook-server.mjs
// (env: SEBPAY_PUBLIC_KEY, SEBPAY_SECRET_KEY, optional SEBPAY_BASE_URL and PORT)

import express from "express";
import { SebpayApiError, SebpayClient, SIGNATURE_HEADER, verifySignature } from "../dist/index.js";

const secretKey = process.env.SEBPAY_SECRET_KEY ?? "sk_test_your_secret";
const sebpay = new SebpayClient(process.env.SEBPAY_PUBLIC_KEY ?? "pk_test_your_key", secretKey, {
  baseUrl: process.env.SEBPAY_BASE_URL || undefined,
});

const app = express();

app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

app.post("/webhook/sebpay", (req, res) => {
  if (!verifySignature(req.rawBody, req.get(SIGNATURE_HEADER), secretKey)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { status, external_reference } = req.body;

  if (status === "approved") {
    // Fulfil the order identified by external_reference (or req.body.metadata).
  } else if (status === "rejected") {
    // Notify the customer of the failed payment.
  }

  res.status(200).json({ received: true });
});

app.get("/orders/return", async (req, res) => {
  const sessionId = req.query.checkout_session_id;

  if (typeof sessionId !== "string" || sessionId === "") {
    return res.status(400).json({ error: "Missing checkout_session_id" });
  }

  try {
    // Coming back proves nothing: ask Sebpay, and deliver only an approved payment.
    const session = await sebpay.checkoutSessions.retrieve(sessionId);

    res.json({
      paid: session.transaction_status === "approved",
      status: session.status,
      external_reference: session.external_reference,
    });
  } catch (err) {
    if (err instanceof SebpayApiError && err.status === 404) {
      return res.status(404).json({ error: "Unknown checkout session" });
    }
    res.status(502).json({ error: "Could not confirm the payment, try again" });
  }
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Listening on :${port}`));
