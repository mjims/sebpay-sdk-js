import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SIGNATURE_HEADER, verifySignature } from "../dist/index.js";

const vectors = JSON.parse(readFileSync(new URL("../../test-vectors/webhooks.json", import.meta.url), "utf8"));

for (const c of vectors.cases) {
  test(`signature vector: ${c.name}`, () => {
    assert.equal(verifySignature(c.body, c.signature, vectors.secret_key), c.valid);
    assert.equal(verifySignature(Buffer.from(c.body, "utf8"), c.signature, vectors.secret_key), c.valid);
  });
}

test("a missing signature or body returns false instead of throwing", () => {
  const [ok] = vectors.cases;
  assert.equal(verifySignature(ok.body, undefined, vectors.secret_key), false);
  assert.equal(verifySignature(ok.body, [ok.signature], vectors.secret_key), false);
  assert.equal(verifySignature(undefined, ok.signature, vectors.secret_key), false);
  assert.equal(verifySignature(null, ok.signature, vectors.secret_key), false);
});

test("SIGNATURE_HEADER names the header Sebpay sends", () => {
  assert.equal(SIGNATURE_HEADER, "X-SebPay-Signature");
});
