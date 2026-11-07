import type { SebpayClient } from "../client";
export interface CreateCollectionParams {
    amount: number;
    currency: string;
    phone: string;
    operator: string;
    country: string;
    external_reference: string;
    callback_url?: string;
    customer_name?: string;
    customer_email?: string;
    otp_code?: string;
}
export interface Collection {
    transaction_id: string;
    status: "pending" | "approved" | "rejected";
    external_reference: string;
    amount: number;
    currency: string;
    provider_link: string | null;
    message: string;
}
export interface CollectionStatus {
    transaction_id: string;
    external_reference: string;
    status: "pending" | "approved" | "rejected";
    amount: number;
    currency: string;
    created_at: string;
    updated_at: string;
}
export declare class Collections {
    private readonly client;
    constructor(client: SebpayClient);
    /**
     * Directly charge a customer's mobile money account — you supply the
     * operator/phone/OTP yourself. For a hosted, redirect-based flow use
     * `SebpayClient.checkoutSessions` instead.
     */
    create(params: CreateCollectionParams): Promise<Collection>;
    retrieve(idOrReference: string): Promise<CollectionStatus>;
}
