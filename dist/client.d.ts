import { CheckoutSessions } from "./resources/checkoutSessions";
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
export declare class SebpayClient {
    #private;
    readonly baseUrl: string;
    readonly checkoutSessions: CheckoutSessions;
    constructor(publicKey: string, secretKey: string, options?: SebpayClientOptions);
}
