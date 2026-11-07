# sebpay-node

Official Node.js SDK for [Sebpay](https://sebpay.africa) **hosted checkout**. It does four things:
- create a checkout session;
- redirect your customer to the Sebpay payment page;
- confirm the payment when they come back;
- verify Sebpay's webhooks.

**Server-side only.** This SDK runs in Node.js (≥ 18). Never bundle it into a browser build: your secret key must never reach the client.

It uses Node's native `fetch` and has no runtime dependency. Direct collections, payouts and reference data are not part of the SDK. They remain available over plain HTTP: see [`docs/SEBPAY_PUBLIC_API.md`](../../docs/SEBPAY_PUBLIC_API.md).

## Install

Not yet published on npm. For now, install it as a local path dependency:

```json
{
  "dependencies": {
    "sebpay-node": "file:../sebpay/sdks/js"
  }
}
```

Then build it once: `cd sdks/js && npm install && npm run build`. `npm pack` builds it too.

## Usage

### 1. Create a session and redirect your customer

```ts
import { SebpayClient } from "sebpay-node";

// Keys from your dashboard (API développeur): pk_test_ keys go to the sandbox server, pk_live_ keys to live.
const sebpay = new SebpayClient(process.env.SEBPAY_PUBLIC_KEY!, process.env.SEBPAY_SECRET_KEY!);

const session = await sebpay.checkoutSessions.create({
  amount: 5000,
  currency: "XOF",
  redirect_url: "https://yoursite.com/orders/return",
  external_reference: order.id, // your order id: sending it again returns the same session
  callback_url: "https://yoursite.com/webhook/sebpay",
  metadata: { order_id: order.id },
});

res.redirect(session.checkout_url);
```

### 2. Confirm the payment when your customer comes back

Your `redirect_url` receives `?checkout_session_id=<id>`. Coming back proves nothing, so ask Sebpay before you deliver:

```ts
const session = await sebpay.checkoutSessions.retrieve(req.query.checkout_session_id);

if (session.transaction_status === "approved") {
  // Paid: deliver the order (session.external_reference, session.metadata).
}
```

`retrieve()` also accepts your `external_reference`.

### 3. Verify the webhook

Sebpay POSTs the final status (`approved` or `rejected`) to your `callback_url`. For a checkout, the request also carries `checkout_session_id` and your `metadata`.

```ts
import express from "express";
import { SIGNATURE_HEADER, verifySignature, type WebhookPayload } from "sebpay-node";

app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

app.post("/webhook/sebpay", (req, res) => {
  if (!verifySignature(req.rawBody, req.get(SIGNATURE_HEADER), process.env.SEBPAY_SECRET_KEY!)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = req.body as WebhookPayload;
  // payload.status: "approved" | "rejected"
  res.status(200).json({ received: true });
});
```

- Always pass the **raw** request body. Re-serializing a parsed payload can reorder keys and break the signature.
- A missing header returns `false`; it never throws.

## Options

```ts
new SebpayClient(publicKey, secretKey, {
  baseUrl: "http://localhost:8000/api/v1", // only to test against a local API; otherwise chosen from the keys
  timeout: 10_000,                         // ms, default 30 000
});
```

`sebpay.baseUrl` tells which server the client talks to.

## Errors

Every failed call throws a `SebpayApiError`, with three fields:
- `status`: the HTTP status, or 0 when no response came back;
- `code`: the API's `errors.code`, or one of the SDK's own codes. Examples: `EXTERNAL_REFERENCE_CONFLICT`, `RATE_LIMITED`, `WRONG_ENVIRONMENT`, `NETWORK_ERROR`, `TIMEOUT`, `INVALID_RESPONSE`. It is `null` otherwise;
- `body`: the decoded response.

```ts
import { SebpayApiError } from "sebpay-node";

try {
  await sebpay.checkoutSessions.create({ ... });
} catch (err) {
  if (err instanceof SebpayApiError && err.code === "EXTERNAL_REFERENCE_CONFLICT") {
    // This order id was already used with other parameters.
  }
}
```

## Examples

See [`examples/`](examples/). Build first (`npm run build`), set `SEBPAY_PUBLIC_KEY` and `SEBPAY_SECRET_KEY`, then:
- `node examples/create-checkout.mjs` creates a session and prints its `checkout_url`;
- `node examples/webhook-server.mjs` starts an Express server (`npm install express`) that handles the webhook and the return page, on `PORT` (default 3001).

For local testing, also set `SEBPAY_BASE_URL`.

## Tests

`npm test` builds the SDK and runs its offline tests with `node --test`. They cover the transport, against a local HTTP server, and the shared signature vectors.

## Requirements

Node.js 18+ (for native `fetch` and `node:crypto`).
