"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SebpayApiError = void 0;
/**
 * Thrown for every failed call. `status` is the HTTP status, or 0 when no response came back
 * (`code` "NETWORK_ERROR" or "TIMEOUT"). `code` is the API's `errors.code` when it sends one
 * (e.g. "EXTERNAL_REFERENCE_CONFLICT", "RATE_LIMITED", "WRONG_ENVIRONMENT"), else null.
 * `body` is the decoded response.
 */
class SebpayApiError extends Error {
    status;
    code;
    body;
    constructor(message, status, code, body) {
        super(message);
        this.status = status;
        this.code = code;
        this.body = body;
        this.name = "SebpayApiError";
    }
}
exports.SebpayApiError = SebpayApiError;
