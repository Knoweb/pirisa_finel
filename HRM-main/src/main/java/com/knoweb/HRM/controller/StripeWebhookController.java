package com.knoweb.HRM.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.service.CompanyService;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.HmacUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/webhook")
public class StripeWebhookController {

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    @Autowired
    private CompanyService companyService;

    // Map Stripe price IDs to plan names (adjust or extend as needed)
    private static final Map<String, String> PRICE_ID_TO_PLAN = new HashMap<>();
    static {
        PRICE_ID_TO_PLAN.put("price_1R9KD8LS4Zd4e05LS6JnMjWL", "BASIC");
        PRICE_ID_TO_PLAN.put("price_1R9MNyLS4Zd4e05LvI3rP6zU", "STANDARD");
        PRICE_ID_TO_PLAN.put("price_1R9Mc1LS4Zd4e05LftHWM8AB", "PREMIUM");


    }

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeEvent(HttpServletRequest request) {
        // Read the raw payload using IOUtils for Java 1.8 compatibility.
        String payload;
        try {
            payload = IOUtils.toString(request.getInputStream(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error reading request payload: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }
        System.out.println("Raw Payload: " + payload);

        // Retrieve and log the Stripe-Signature header.
        String sigHeader = request.getHeader("Stripe-Signature");
        System.out.println("Stripe-Signature header: " + sigHeader);
        if (sigHeader == null) {
            System.err.println("Missing Stripe-Signature header");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing Stripe-Signature header");
        }

        // --- Extra Logging: Manually parse the signature header and compute the expected signature ---
        String[] parts = sigHeader.split(",");
        String timestamp = null;
        String headerV1 = null;
        for (String part : parts) {
            String[] kv = part.split("=");
            if (kv.length == 2) {
                if ("t".equals(kv[0])) {
                    timestamp = kv[1].trim();
                } else if ("v1".equals(kv[0])) {
                    headerV1 = kv[1].trim();
                }
            }
        }
        if (timestamp != null && headerV1 != null) {
            // Stripe computes signature using: HMAC_SHA256(secret, "{timestamp}.{payload}")
            String payloadToSign = timestamp + "." + payload;
            String computedSignature = Hex.encodeHexString(HmacUtils.hmacSha256(endpointSecret, payloadToSign));
            System.out.println("Parsed Timestamp: " + timestamp);
            System.out.println("Signature from header (v1): " + headerV1);
            System.out.println("Computed signature: " + computedSignature);
        } else {
            System.err.println("Invalid Stripe-Signature header format: " + sigHeader);
        }
        // --- End Extra Logging ---

        // Use Stripe's library to verify the signature and construct the Event object.
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            System.err.println("Webhook signature verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Webhook signature verification failed: " + e.getMessage());
        }
        System.out.println("Received event type: " + event.getType());

        // Process the event based on its type.
        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                Map<String, String> metadata = session.getMetadata();
                System.out.println("Checkout Session Metadata: " + metadata);
                String companyIdStr = metadata.get("companyId");
                String priceId = metadata.get("priceId");
                if (companyIdStr != null && priceId != null) {
                    try {
                        long companyId = Long.parseLong(companyIdStr);
                        Company company = companyService.getCompanyById(companyId);
                        if (company != null) {
                            String planName = PRICE_ID_TO_PLAN.getOrDefault(priceId, "UNKNOWN");
                            company.setPackage_name(planName);
                            company.setCompany_status("ACTIVE");
                            companyService.updateCompany(company);
                            System.out.println("Updated company " + company.getId() +
                                    " to plan " + planName + " with status ACTIVE");
                        } else {
                            System.err.println("Company not found for companyId: " + companyId);
                        }
                    } catch (NumberFormatException ex) {
                        System.err.println("Invalid companyId format in metadata: " + companyIdStr);
                    }
                } else {
                    System.err.println("Missing companyId or priceId in metadata");
                }
            } else {
                System.err.println("Checkout session object is null");
            }
        } else if ("invoice.payment_succeeded".equals(event.getType())) {
            // Recurring payment succeeded – update the company's status to ACTIVE.
            Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
            if (invoice != null) {
                String customerId = invoice.getCustomer();
                System.out.println("Invoice payment succeeded for customer: " + customerId);
                Company company = companyService.getCompanyByStripeCustomerId(customerId);
                if (company != null) {
                    company.setCompany_status("ACTIVE");
                    companyService.updateCompany(company);
                    System.out.println("Updated company " + company.getId() + " status to ACTIVE (invoice succeeded)");
                } else {
                    System.err.println("No company found for customer id: " + customerId);
                }
            } else {
                System.err.println("Invoice object is null");
            }
        } else if ("payment_intent.payment_failed".equals(event.getType())) {
            // PaymentIntent failed – mark the company as INACTIVE.
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (paymentIntent != null) {
                String customerId = paymentIntent.getCustomer();
                System.out.println("Payment failed for customer: " + customerId);
                if (customerId != null) {
                    Company company = companyService.getCompanyByStripeCustomerId(customerId);
                    if (company != null) {
                        company.setCompany_status("INACTIVE");
                        companyService.updateCompany(company);
                        System.out.println("Updated company " + company.getId() +
                                " status to INACTIVE due to payment failure");
                    } else {
                        System.err.println("No company found for customer id: " + customerId);
                    }
                }
            } else {
                System.err.println("PaymentIntent object is null");
            }
        } else if ("invoice.payment_failed".equals(event.getType())) {
            // Invoice payment failed – mark the company as INACTIVE.
            Invoice invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElse(null);
            if (invoice != null) {
                String customerId = invoice.getCustomer();
                System.out.println("Invoice payment failed for customer: " + customerId);
                if (customerId != null) {
                    Company company = companyService.getCompanyByStripeCustomerId(customerId);
                    if (company != null) {
                        company.setCompany_status("INACTIVE");
                        companyService.updateCompany(company);
                        System.out.println("Updated company " + company.getId() +
                                " status to INACTIVE due to invoice payment failure");
                    } else {
                        System.err.println("No company found for customer id: " + customerId);
                    }
                }
            } else {
                System.err.println("Invoice object is null");
            }
        } else {
            System.out.println("Unhandled event type: " + event.getType());
        }

        return ResponseEntity.ok("Success");
    }
}
