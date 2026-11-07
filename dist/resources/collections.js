"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collections = void 0;
class Collections {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Directly charge a customer's mobile money account — you supply the
     * operator/phone/OTP yourself. For a hosted, redirect-based flow use
     * `SebpayClient.checkoutSessions` instead.
     */
    create(params) {
        return this.client.request("POST", "/collections", params);
    }
    retrieve(idOrReference) {
        return this.client.request("GET", `/collections/${encodeURIComponent(idOrReference)}`);
    }
}
exports.Collections = Collections;
