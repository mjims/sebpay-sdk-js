"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SebpayClient = void 0;
const errors_1 = require("./errors");
const checkoutSessions_1 = require("./resources/checkoutSessions");
const version_1 = require("./version");
const LIVE_BASE_URL = "https://newapi.sebpay.africa/api/v1";
const SANDBOX_BASE_URL = "https://api.sandbox.sebpay.bj/api/v1";
// Same 30 s default as the PHP and Python SDKs — fetch has no timeout of its own.
const DEFAULT_TIMEOUT_MS = 30_000;
/**
 * Entry point for Sebpay hosted checkout. Server-side only — the secret key must never reach a
 * browser bundle. Pass the key pair from your dashboard (API développeur): the sandbox and live
 * are separate servers, and pk_test_ keys are sent to the sandbox, pk_live_ keys to live.
 */
class SebpayClient {
    baseUrl;
    checkoutSessions;
    #publicKey;
    #secretKey;
    #timeout;
    constructor(publicKey, secretKey, options = {}) {
        this.#publicKey = publicKey;
        this.#secretKey = secretKey;
        this.#timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
        this.baseUrl = (options.baseUrl ?? (publicKey.startsWith("pk_test_") ? SANDBOX_BASE_URL : LIVE_BASE_URL)).replace(/\/+$/, "");
        this.checkoutSessions = new checkoutSessions_1.CheckoutSessions((method, path, body) => this.#request(method, path, body));
    }
    /** Returns the `data` field of a successful response; throws SebpayApiError otherwise. */
    async #request(method, path, body) {
        const headers = {
            "X-Public-Key": this.#publicKey,
            "X-Secret-Key": this.#secretKey,
            Accept: "application/json",
            "User-Agent": `sebpay-node/${version_1.VERSION}`,
        };
        if (body !== undefined)
            headers["Content-Type"] = "application/json";
        let res;
        let text;
        try {
            res = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(this.#timeout),
            });
            text = await res.text();
        }
        catch (err) {
            if (err instanceof Error && err.name === "TimeoutError") {
                throw new errors_1.SebpayApiError(`Sebpay request timed out after ${this.#timeout} ms`, 0, "TIMEOUT", null);
            }
            const cause = err instanceof Error ? (err.cause?.message ?? err.message) : String(err);
            throw new errors_1.SebpayApiError(`Sebpay request failed: ${cause}`, 0, "NETWORK_ERROR", null);
        }
        let decoded = null;
        try {
            decoded = JSON.parse(text);
        }
        catch {
            // not JSON: handled below
        }
        if (!res.ok || decoded?.success === false) {
            const code = typeof decoded?.errors?.code === "string" ? decoded.errors.code : null;
            throw new errors_1.SebpayApiError(decoded?.message ?? `Sebpay API error (HTTP ${res.status})`, res.status, code, decoded ?? text);
        }
        if (decoded === null || typeof decoded !== "object" || !("data" in decoded)) {
            throw new errors_1.SebpayApiError("Sebpay API returned an unexpected response", res.status, "INVALID_RESPONSE", decoded ?? text);
        }
        return decoded.data;
    }
}
exports.SebpayClient = SebpayClient;
