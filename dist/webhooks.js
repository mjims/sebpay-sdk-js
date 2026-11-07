"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGNATURE_HEADER = void 0;
exports.verifySignature = verifySignature;
const node_crypto_1 = require("node:crypto");
/** The header carrying the signature of every Sebpay webhook. */
exports.SIGNATURE_HEADER = "X-SebPay-Signature";
/**
 * Verifies the `X-SebPay-Signature` header Sebpay sends with every webhook callback. Always pass
 * the raw request body — re-serializing a parsed payload (e.g. via JSON.stringify after parsing)
 * can reorder keys and break the signature. A missing signature or body returns false.
 */
function verifySignature(rawBody, signature, secretKey) {
    if (typeof signature !== "string" || signature === "")
        return false;
    if (typeof rawBody !== "string" && !(rawBody instanceof Uint8Array))
        return false;
    const expected = (0, node_crypto_1.createHmac)("sha256", secretKey).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== signatureBuf.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(expectedBuf, signatureBuf);
}
