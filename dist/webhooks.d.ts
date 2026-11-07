/** The header carrying the signature of every Sebpay webhook. */
export declare const SIGNATURE_HEADER = "X-SebPay-Signature";
/** The body Sebpay POSTs to your callback_url once a payment is final. */
export interface WebhookPayload {
    transaction_id: string;
    external_reference: string | null;
    /** Only final statuses are sent. */
    status: "approved" | "rejected";
    amount: number;
    currency: string;
    customer_phone: string | null;
    created_at: string;
    updated_at: string;
    /** The checkout session this payment belongs to. */
    checkout_session_id?: string;
    /** The metadata you attached to that session. */
    metadata?: Record<string, unknown> | null;
}
/**
 * Verifies the `X-SebPay-Signature` header Sebpay sends with every webhook callback. Always pass
 * the raw request body — re-serializing a parsed payload (e.g. via JSON.stringify after parsing)
 * can reorder keys and break the signature. A missing signature or body returns false.
 */
export declare function verifySignature(rawBody: string | Uint8Array | null | undefined, signature: string | string[] | null | undefined, secretKey: string): boolean;
