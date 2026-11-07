import type { Requester } from "../client";

export interface CreateCheckoutSessionParams {
  amount: number;
  /** ISO code, e.g. "XOF". */
  currency: string;
  /** Where your customer lands after paying, with `?checkout_session_id=<id>` appended. */
  redirect_url: string;
  /** Your order id. Sending it again with the same parameters returns the same session (`idempotent_replay`). */
  external_reference?: string;
  /** Receives the signed webhook when the payment is approved or rejected (https). */
  callback_url?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  /** Echoed back on the session and in its webhook. */
  metadata?: Record<string, unknown>;
}

export type CheckoutSessionStatus = "open" | "completed" | "expired" | "canceled";

export interface CheckoutSession {
  id: string;
  status: CheckoutSessionStatus;
  /** The Sebpay-hosted page to redirect your customer to. */
  checkout_url: string;
  amount: number;
  currency: string;
  external_reference: string | null;
  metadata: Record<string, unknown> | null;
  expires_at: string;
  /** Present (true) when this external_reference had already created the session: it is returned as is. */
  idempotent_replay?: true;
}

export interface CheckoutSessionDetails extends Omit<CheckoutSession, "idempotent_replay"> {
  /** The latest payment attempt, if any. */
  transaction_id: string | null;
  /** "approved" is the only status that means paid. */
  transaction_status: "pending" | "approved" | "rejected" | null;
  created_at: string;
}

export class CheckoutSessions {
  constructor(private readonly request: Requester) {}

  /** Create a hosted checkout session and get back a `checkout_url` to redirect your customer to. */
  create(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
    return this.request("POST", "/checkout/sessions", { ...params });
  }

  /**
   * Retrieve a session by its id (the `checkout_session_id` of your redirect_url), its token or your
   * external_reference. This is the server-to-server confirmation: when your customer comes back,
   * deliver only if `transaction_status` is "approved" — the redirect alone proves nothing.
   */
  retrieve(idOrReference: string): Promise<CheckoutSessionDetails> {
    return this.request("GET", `/checkout/sessions/${encodeURIComponent(idOrReference)}`);
  }
}
