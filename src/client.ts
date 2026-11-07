import { SebpayApiError } from "./errors";
import { CheckoutSessions } from "./resources/checkoutSessions";
import { VERSION } from "./version";

const LIVE_BASE_URL = "https://newapi.sebpay.africa/api/v1";
const SANDBOX_BASE_URL = "https://api.sandbox.sebpay.bj/api/v1";
// Same 30 s default as the PHP and Python SDKs — fetch has no timeout of its own.
const DEFAULT_TIMEOUT_MS = 30_000;

export interface SebpayClientOptions {
  /** API URL. By default it follows the keys: pk_test_ → sandbox server, otherwise live. */
  baseUrl?: string;
  /** Request timeout, in milliseconds (default 30 000). */
  timeout?: number;
}

/** How a resource reaches the API — kept internal, so the SDK only calls the endpoints it wraps. */
export type Requester = <T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>) => Promise<T>;

/**
 * Entry point for Sebpay hosted checkout. Server-side only — the secret key must never reach a
 * browser bundle. Pass the key pair from your dashboard (API développeur): the sandbox and live
 * are separate servers, and pk_test_ keys are sent to the sandbox, pk_live_ keys to live.
 */
export class SebpayClient {
  readonly baseUrl: string;
  readonly checkoutSessions: CheckoutSessions;

  readonly #publicKey: string;
  readonly #secretKey: string;
  readonly #timeout: number;

  constructor(publicKey: string, secretKey: string, options: SebpayClientOptions = {}) {
    this.#publicKey = publicKey;
    this.#secretKey = secretKey;
    this.#timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.baseUrl = (options.baseUrl ?? (publicKey.startsWith("pk_test_") ? SANDBOX_BASE_URL : LIVE_BASE_URL)).replace(/\/+$/, "");

    this.checkoutSessions = new CheckoutSessions((method, path, body) => this.#request(method, path, body));
  }

  /** Returns the `data` field of a successful response; throws SebpayApiError otherwise. */
  async #request<T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
    const headers: Record<string, string> = {
      "X-Public-Key": this.#publicKey,
      "X-Secret-Key": this.#secretKey,
      Accept: "application/json",
      "User-Agent": `sebpay-node/${VERSION}`,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let res: Response;
    let text: string;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.#timeout),
      });
      text = await res.text();
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new SebpayApiError(`Sebpay request timed out after ${this.#timeout} ms`, 0, "TIMEOUT", null);
      }
      const cause = err instanceof Error ? ((err.cause as Error | undefined)?.message ?? err.message) : String(err);
      throw new SebpayApiError(`Sebpay request failed: ${cause}`, 0, "NETWORK_ERROR", null);
    }

    let decoded: any = null;
    try {
      decoded = JSON.parse(text);
    } catch {
      // not JSON: handled below
    }

    if (!res.ok || decoded?.success === false) {
      const code = typeof decoded?.errors?.code === "string" ? decoded.errors.code : null;
      throw new SebpayApiError(decoded?.message ?? `Sebpay API error (HTTP ${res.status})`, res.status, code, decoded ?? text);
    }

    if (decoded === null || typeof decoded !== "object" || !("data" in decoded)) {
      throw new SebpayApiError("Sebpay API returned an unexpected response", res.status, "INVALID_RESPONSE", decoded ?? text);
    }

    return decoded.data as T;
  }
}
