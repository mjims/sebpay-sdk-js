"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutSessions = void 0;
class CheckoutSessions {
    request;
    constructor(request) {
        this.request = request;
    }
    /** Create a hosted checkout session and get back a `checkout_url` to redirect your customer to. */
    create(params) {
        return this.request("POST", "/checkout/sessions", { ...params });
    }
    /**
     * Retrieve a session by its id (the `checkout_session_id` of your redirect_url), its token or your
     * external_reference. This is the server-to-server confirmation: when your customer comes back,
     * deliver only if `transaction_status` is "approved" — the redirect alone proves nothing.
     */
    retrieve(idOrReference) {
        return this.request("GET", `/checkout/sessions/${encodeURIComponent(idOrReference)}`);
    }
}
exports.CheckoutSessions = CheckoutSessions;
