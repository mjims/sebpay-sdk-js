"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payouts = void 0;
class Payouts {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Send funds from your Sebpay wallet to a mobile money recipient. The
     * balance is deducted immediately; final confirmation arrives via webhook.
     */
    create(params) {
        return this.client.request("POST", "/payouts", params);
    }
    retrieve(idOrReference) {
        return this.client.request("GET", `/payouts/${encodeURIComponent(idOrReference)}`);
    }
}
exports.Payouts = Payouts;
