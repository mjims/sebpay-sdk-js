"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.References = void 0;
class References {
    client;
    constructor(client) {
        this.client = client;
    }
    countries() {
        return this.client.request("GET", "/countries");
    }
    operators(countryCode) {
        return this.client.request("GET", "/operators", countryCode ? { country: countryCode } : {});
    }
    /**
     * Preview the fee (in XOF) for a corridor before creating a transaction. Country codes are ISO
     * (e.g. "bj"). This is the standard public tariff: it does not know a tariff negotiated for
     * your account, so the fee actually charged can differ.
     */
    calculateFee(amount, sourceCountry, destinationCountry, transactionType = "collection") {
        return this.client.request("GET", "/c/calculate-fee", {
            amount,
            source_country: sourceCountry,
            destination_country: destinationCountry,
            transaction_type: transactionType,
        });
    }
}
exports.References = References;
