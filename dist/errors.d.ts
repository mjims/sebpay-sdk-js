/**
 * Thrown for every failed call. `status` is the HTTP status, or 0 when no response came back
 * (`code` "NETWORK_ERROR" or "TIMEOUT"). `code` is the API's `errors.code` when it sends one
 * (e.g. "EXTERNAL_REFERENCE_CONFLICT", "RATE_LIMITED", "WRONG_ENVIRONMENT"), else null.
 * `body` is the decoded response.
 */
export declare class SebpayApiError extends Error {
    readonly status: number;
    readonly code: string | null;
    readonly body: unknown;
    constructor(message: string, status: number, code: string | null, body: unknown);
}
