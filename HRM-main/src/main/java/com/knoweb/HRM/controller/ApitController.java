package com.knoweb.HRM.controller;

import com.knoweb.HRM.model.TaxResponse;
import com.knoweb.HRM.service.TaxCalculationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/apit")
public class ApitController {

    @Autowired
    private TaxCalculationService service;

    // 1. Regular Income Tax (Table No. 01)
    // Example: /api/tax/regular?amount=200000
    @GetMapping("/regular")
    public TaxResponse getRegularTax(@RequestParam("amount") BigDecimal amount) {
        BigDecimal tax = service.calculateRegularTax(amount);
        return new TaxResponse("Regular Income Tax", tax);
    }

    // 2. Lump-Sum Payment Tax (Table No. 02)
    // Example: /api/tax/lump-sum?paid=170000&payable=1870000&lumpSum=600000&monthlyTax=calculatedValue&prevLumpTax=0
    @GetMapping("/lump-sum")
    public TaxResponse getLumpSumTax(@RequestParam("paid") BigDecimal paid,
                                     @RequestParam("payable") BigDecimal payable,
                                     @RequestParam("lumpSum") BigDecimal lumpSum,
                                     @RequestParam("monthlyTax") BigDecimal monthlyTax,
                                     @RequestParam(value = "prevLumpTax", defaultValue = "0") BigDecimal prevLumpTax) {
        BigDecimal tax = service.calculateLumpSumTax(paid, payable, lumpSum, monthlyTax, prevLumpTax);
        return new TaxResponse("Lump-Sum Payment Tax", tax);
    }

    // 3. Terminal Payments Guidelines (Table No. 03)
    @GetMapping("/terminal")
    public TaxResponse getTerminalPaymentGuidelines() {
        String msg = service.getTerminalPaymentGuidelines();
        return new TaxResponse("Terminal Payment Guidelines", new BigDecimal("0"));
    }

    // 4A. Non-resident, Non-citizen Regular Income Tax (Table No. 04, Part A)
    // Example: /api/tax/nonresident/regular?amount=150000
    @GetMapping("/nonresident/regular")
    public TaxResponse getNonResidentRegularTax(@RequestParam("amount") BigDecimal amount) {
        BigDecimal tax = service.calculateNonResidentRegularTax(amount);
        return new TaxResponse("Non-resident Regular Income Tax", tax);
    }

    // 4B. Non-resident, Non-citizen Lump-Sum Payment Tax (Table No. 04, Part B)
    // Example: /api/tax/nonresident/lump-sum?paid=250000&payable=750000&lumpSum=1000000&monthlyTax=calculatedValue&prevLumpTax=0
    @GetMapping("/nonresident/lump-sum")
    public TaxResponse getNonResidentLumpSumTax(@RequestParam("paid") BigDecimal paid,
                                                @RequestParam("payable") BigDecimal payable,
                                                @RequestParam("lumpSum") BigDecimal lumpSum,
                                                @RequestParam("monthlyTax") BigDecimal monthlyTax,
                                                @RequestParam(value = "prevLumpTax", defaultValue = "0") BigDecimal prevLumpTax) {
        BigDecimal tax = service.calculateNonResidentLumpSumTax(paid, payable, lumpSum, monthlyTax, prevLumpTax);
        return new TaxResponse("Non-resident Lump-Sum Payment Tax", tax);
    }

    // 5. Cumulative Gains and Profits Tax (Table No. 05)
    // Example: /api/tax/cumulative?cumulativeIncome=2500000&prevTax=5000
    @GetMapping("/cumulative")
    public TaxResponse getCumulativeTax(@RequestParam("cumulativeIncome") BigDecimal cumulativeIncome,
                                        @RequestParam("prevTax") BigDecimal prevTax) {
        BigDecimal tax = service.calculateCumulativeTax(cumulativeIncome, prevTax);
        return new TaxResponse("Cumulative Tax", tax);
    }

    // 6. Tax-on-Tax for Monthly Remuneration (Table No. 06, Table 6.1)
    // Example: /api/tax/tax-on-tax/monthly?amount=300000
    @GetMapping("/tax-on-tax/monthly")
    public TaxResponse getMonthlyTaxOnTax(@RequestParam("amount") BigDecimal amount) {
        BigDecimal tax = service.calculateMonthlyTaxOnTax(amount);
        return new TaxResponse("Monthly Tax-on-Tax", tax);
    }

    // 6B. Lump-Sum Tax-on-Tax (Cumulative) – optional endpoint
    // Example: /api/tax/tax-on-tax/lump-sum?paid=...&payable=...&lumpSum=...&taxOnTaxMonthly=...&prevLumpTaxOnTax=...
    @GetMapping("/tax-on-tax/lump-sum")
    public TaxResponse getLumpSumTaxOnTax(@RequestParam("paid") BigDecimal paid,
                                          @RequestParam("payable") BigDecimal payable,
                                          @RequestParam("lumpSum") BigDecimal lumpSum,
                                          @RequestParam("taxOnTaxMonthly") BigDecimal taxOnTaxMonthly,
                                          @RequestParam(value = "prevLumpTaxOnTax", defaultValue = "0") BigDecimal prevLumpTaxOnTax) {
        BigDecimal tax = service.calculateLumpSumTaxOnTax(paid, payable, lumpSum, taxOnTaxMonthly, prevLumpTaxOnTax);
        return new TaxResponse("Lump-Sum Tax-on-Tax", tax);
    }

    // 7A. Secondary Employment Tax for Resident Employees (Table No. 07, Part A)
    // Example: /api/tax/secondary/resident?primary=250000&secondary=100000
    @GetMapping("/secondary/resident")
    public TaxResponse getSecondaryTaxForResident(@RequestParam("primary") BigDecimal primaryIncome,
                                                  @RequestParam("secondary") BigDecimal secondaryIncome) {
        BigDecimal tax = service.calculateSecondaryEmploymentTaxForResident(primaryIncome, secondaryIncome);
        return new TaxResponse("Secondary Employment Tax (Resident)", tax);
    }

    // 7B. Secondary Employment Tax for Non-Resident Employees (Table No. 07, Part B)
    // Example: /api/tax/secondary/nonresident?secondary=100000
    @GetMapping("/secondary/nonresident")
    public TaxResponse getSecondaryTaxForNonResident(@RequestParam("secondary") BigDecimal secondaryIncome) {
        BigDecimal tax = service.calculateSecondaryEmploymentTaxForNonResident(secondaryIncome);
        return new TaxResponse("Secondary Employment Tax (Non-Resident)", tax);
    }

    // 8. Income from a Foreign Employer (Tax Table No. 08)
    // Example: /api/tax/foreign?cumulativeIncome=10000000&prevTax=200000
    @GetMapping("/foreign")
    public TaxResponse getForeignEmployerTax(@RequestParam("cumulativeIncome") BigDecimal cumulativeIncome,
                                             @RequestParam("prevTax") BigDecimal prevTax) {
        BigDecimal tax = service.calculateForeignEmployerTax(cumulativeIncome, prevTax);
        return new TaxResponse("Foreign Employer Income Tax", tax);
    }
}
