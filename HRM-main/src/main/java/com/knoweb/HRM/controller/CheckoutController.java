package com.knoweb.HRM.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.service.CompanyService;
import com.knoweb.HRM.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CompanyService companyService;

    @Value("${app.domain}")
    private String domain;  // e.g., http://localhost:8080 or your public domain

    /**
     * Create a Stripe Checkout session.
     * Expected JSON:
     * {
     *   "companyId": "5",
     *   "priceId": "price_1R9MNyLS4Zd4e05LvI3rP6zU"
     * }
     */
    @PostMapping("/create-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@RequestBody Map<String, String> payload)
            throws StripeException {

        String companyId = payload.get("companyId");
        String priceId = payload.get("priceId");

        if (companyId == null || priceId == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Missing companyId or priceId");
            return ResponseEntity.badRequest().body(error);
        }

        Company company = companyService.getCompanyById(Long.parseLong(companyId));
        if (company == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Company not found");
            return ResponseEntity.badRequest().body(error);
        }

        // Create Stripe customer if not exists
        if (company.getStripeCustomerId() == null || company.getStripeCustomerId().isEmpty()) {
            com.stripe.model.Customer customer = paymentService.createStripeCustomer(company);
            company.setStripeCustomerId(customer.getId());
            companyService.updateCompany(company);
        }

        // Create the Checkout session with metadata
        Session session = paymentService.createCheckoutSession(companyId, priceId, domain);
        Map<String, String> responseData = new HashMap<>();
        responseData.put("id", session.getId());
        return ResponseEntity.ok(responseData);
    }
}
