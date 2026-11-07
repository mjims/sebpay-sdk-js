import type { SebpayClient } from "../client";
/** Only countries with at least one active operator are listed, so there is no `is_active` flag. */
export interface Country {
    id: string;
    country_name: string;
    country_code: string;
    prefix: string;
    currency_id: string;
    currency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
    };
}
/**
 * Only active operators are listed. `code` ("mtn") or `slug` ("mtn-bj") can be passed as the
 * `operator` of a collection or payout; `payin_enabled` / `payout_enabled` tell which of the two
 * directions the operator currently supports.
 */
export interface Operator {
    id: string;
    name: string;
    slug: string;
    code: string;
    country_id: string;
    country: {
        id: string;
        country_name: string;
        country_code: string;
    };
    otp_required: boolean;
    ussd_code: string | null;
    payin_enabled: boolean;
    payout_enabled: boolean;
}
export interface FeeCalculation {
    fee_amount: number;
}
export declare class References {
    private readonly client;
    constructor(client: SebpayClient);
    countries(): Promise<Country[]>;
    operators(countryCode?: string): Promise<Operator[]>;
    /**
     * Preview the fee (in XOF) for a corridor before creating a transaction. Country codes are ISO
     * (e.g. "bj"). This is the standard public tariff: it does not know a tariff negotiated for
     * your account, so the fee actually charged can differ.
     */
    calculateFee(amount: number, sourceCountry: string, destinationCountry: string, transactionType?: "collection" | "payout"): Promise<FeeCalculation>;
}
