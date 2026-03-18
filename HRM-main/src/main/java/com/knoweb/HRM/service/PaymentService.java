package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Company;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        // Initialize Stripe with your secret key
        Stripe.apiKey = stripeApiKey;
    }

    // Create a Stripe customer using the company's details.
    public Customer createStripeCustomer(Company company) throws StripeException {
        Map<String, Object> params = new HashMap<>();
        params.put("email", company.getCmpEmail());
        params.put("name", company.getCmp_name());
        // Optionally add metadata for later reference.
        Map<String, String> metadata = new HashMap<>();
        metadata.put("companyId", String.valueOf(company.getId()));
        params.put("metadata", metadata);
        return Customer.create(params);
    }

    /**
     * Create a Stripe Checkout session for a subscription.
     * Metadata includes companyId and priceId.
     */
    public Session createCheckoutSession(String companyId, String priceId, String domain) throws StripeException {
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl(domain + "/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(domain + "/cancel")
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build()
                )
                .putMetadata("companyId", companyId)
                .putMetadata("priceId", priceId)
                .build();

        return Session.create(params);
    }
}
