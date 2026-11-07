import type { SebpayClient } from "../client";

export interface CreatePayoutParams {
  recipient_name: string;
  phone: string;
  operator: string;
  country: string;
  amount: number;
  currency: string;
  external_reference: string;
  callback_url?: string;
  description?: string;
}

export interface Payout {
  transaction_id: string;
  status: "pending" | "approved" | "rejected";
  external_reference: string;
  amount: number;
  fee_amount: number;
  total_deducted: number;
  currency: string;
}

export interface PayoutStatus {
  transaction_id: string;
  external_reference: string;
  status: "pending" | "approved" | "rejected";
  amount: number;
  fee_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export class Payouts {
  constructor(private readonly client: SebpayClient) {}

  /**
   * Send funds from your Sebpay wallet to a mobile money recipient. The
   * balance is deducted immediately; final confirmation arrives via webhook.
   */
  create(params: CreatePayoutParams): Promise<Payout> {
    return this.client.request("POST", "/payouts", params as unknown as Record<string, unknown>);
  }

  retrieve(idOrReference: string): Promise<PayoutStatus> {
    return this.client.request("GET", `/payouts/${encodeURIComponent(idOrReference)}`);
  }
}
