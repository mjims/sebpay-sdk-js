import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import * as sdk from "../dist/index.js";

const { SebpayClient, SebpayApiError, VERSION } = sdk;

// A local stand-in for the API: the first path segment picks the answer.
let server;
let base;
let last;

const answers = {
  ok: (req, body, res) => json(res, 200, { success: true, data: { echo: { method: req.method, url: req.url, body } } }),
  conflict: (req, body, res) => json(res, 409, { success: false, message: "Already used", errors: { code: "EXTERNAL_REFERENCE_CONFLICT" } }),
  invalid: (req, body, res) => json(res, 422, { success: false, message: "Validation Error.", errors: { redirect_url: ["required"] } }),
  refused: (req, body, res) => json(res, 200, { success: false, message: "Refused" }),
  nodata: (req, body, res) => json(res, 200, { success: true }),
  html: (req, body, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<html>maintenance</html>"); },
  gateway: (req, body, res) => { res.writeHead(502, { "Content-Type": "text/html" }); res.end("<html>Bad gateway</html>"); },
  slow: (req, body, res) => setTimeout(() => json(res, 200, { success: true, data: {} }), 1500),
};

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

before(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      last = { method: req.method, url: req.url, headers: req.headers, raw };
      answers[req.url.split("/")[1]](req, raw ? JSON.parse(raw) : null, res);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const client = (mode, options = {}) => new SebpayClient("pk_test_pub", "sk_test_sec", { baseUrl: `${base}/${mode}`, ...options });
const rejection = async (promise) => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  assert.fail("expected the call to throw");
};

test("the base URL follows the key prefix, an explicit baseUrl wins", () => {
  assert.equal(new SebpayClient("pk_test_x", "sk_test_x").baseUrl, "https://api.sandbox.sebpay.bj/api/v1");
  assert.equal(new SebpayClient("pk_live_x", "sk_live_x").baseUrl, "https://newapi.sebpay.africa/api/v1");
  assert.equal(new SebpayClient("pk_test_x", "sk_test_x", { baseUrl: "http://localhost:8000/api/v1/" }).baseUrl, "http://localhost:8000/api/v1");
});

test("the SDK only exposes hosted checkout", () => {
  const sebpay = client("ok");
  assert.equal(typeof sebpay.checkoutSessions.create, "function");
  assert.equal(typeof sebpay.checkoutSessions.retrieve, "function");
  for (const gone of ["collections", "payouts", "references", "request"]) assert.equal(sebpay[gone], undefined, gone);
  const runtime = Object.keys(sdk).filter((k) => !["default", "module.exports", "__esModule"].includes(k)).sort();
  assert.deepEqual(runtime, ["SIGNATURE_HEADER", "SebpayApiError", "SebpayClient", "VERSION", "verifySignature"]);
});

test("VERSION matches package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(VERSION, pkg.version);
});

test("create() POSTs the params as JSON with the keys and the User-Agent", async () => {
  const data = await client("ok").checkoutSessions.create({ amount: 5000, currency: "XOF", redirect_url: "https://shop.test/r", metadata: { a: 1 } });
  assert.deepEqual(data.echo, { method: "POST", url: "/ok/checkout/sessions", body: { amount: 5000, currency: "XOF", redirect_url: "https://shop.test/r", metadata: { a: 1 } } });
  assert.equal(last.headers["x-public-key"], "pk_test_pub");
  assert.equal(last.headers["x-secret-key"], "sk_test_sec");
  assert.equal(last.headers["user-agent"], `sebpay-node/${VERSION}`);
  assert.equal(last.headers["content-type"], "application/json");
  assert.equal(last.headers.accept, "application/json");
});

test("retrieve() GETs the id URL-encoded, without a body", async () => {
  const data = await client("ok").checkoutSessions.retrieve("A/B C?d");
  assert.equal(data.echo.url, "/ok/checkout/sessions/A%2FB%20C%3Fd");
  assert.equal(data.echo.method, "GET");
  assert.equal(last.raw, "");
});

test("an API error carries status, code and body", async () => {
  const err = await rejection(client("conflict").checkoutSessions.retrieve("x"));
  assert.ok(err instanceof SebpayApiError);
  assert.equal(err.status, 409);
  assert.equal(err.code, "EXTERNAL_REFERENCE_CONFLICT");
  assert.equal(err.message, "Already used");
  assert.deepEqual(err.body.errors, { code: "EXTERNAL_REFERENCE_CONFLICT" });
});

test("an error without errors.code has code null", async () => {
  const err = await rejection(client("invalid").checkoutSessions.retrieve("x"));
  assert.equal(err.status, 422);
  assert.equal(err.code, null);
  assert.deepEqual(err.body.errors.redirect_url, ["required"]);
});

test("success: false is an error even with HTTP 200", async () => {
  const err = await rejection(client("refused").checkoutSessions.retrieve("x"));
  assert.equal(err.status, 200);
  assert.equal(err.message, "Refused");
});

test("a 2xx without data, or not JSON, is INVALID_RESPONSE", async () => {
  for (const mode of ["nodata", "html"]) {
    const err = await rejection(client(mode).checkoutSessions.retrieve("x"));
    assert.equal(err.code, "INVALID_RESPONSE", mode);
    assert.equal(err.status, 200, mode);
  }
});

test("a non-JSON error page keeps its HTTP status and text", async () => {
  const err = await rejection(client("gateway").checkoutSessions.retrieve("x"));
  assert.equal(err.status, 502);
  assert.equal(err.code, null);
  assert.match(err.body, /Bad gateway/);
});

test("no server → status 0, NETWORK_ERROR", async () => {
  const closed = createServer();
  await new Promise((resolve) => closed.listen(0, "127.0.0.1", resolve));
  const port = closed.address().port;
  await new Promise((resolve) => closed.close(resolve));
  const err = await rejection(new SebpayClient("pk_test_x", "sk_test_x", { baseUrl: `http://127.0.0.1:${port}` }).checkoutSessions.retrieve("x"));
  assert.ok(err instanceof SebpayApiError);
  assert.equal(err.status, 0);
  assert.equal(err.code, "NETWORK_ERROR");
});

test("the timeout option aborts a slow request → status 0, TIMEOUT", async () => {
  const started = Date.now();
  const err = await rejection(client("slow", { timeout: 200 }).checkoutSessions.retrieve("x"));
  assert.equal(err.status, 0);
  assert.equal(err.code, "TIMEOUT");
  assert.ok(Date.now() - started < 1200);
});
