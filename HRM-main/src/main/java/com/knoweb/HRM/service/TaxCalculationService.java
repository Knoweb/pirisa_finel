package com.knoweb.HRM.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class TaxCalculationService {

    // 1. Regular Income Tax (Tax Table No. 01)
    // M: monthly regular profits (after a personal relief of Rs. 150,000 has been factored in)
    // Rules:
    //   - If M ≤ 150,000:    Tax = 0
    //   - If 150,000 < M ≤ 233,333: Tax = 6% * M – 9,000
    //   - If 233,333 < M ≤ 275,000: Tax = 18% * M – 37,000
    //   - If 275,000 < M ≤ 316,667: Tax = 24% * M – 53,500
    //   - If 316,667 < M ≤ 358,333: Tax = 30% * M – 72,500
    //   - If M > 358,333:         Tax = 36% * M – 94,000
    public BigDecimal calculateRegularTax(BigDecimal M) {
        BigDecimal tax;
        if (M.compareTo(new BigDecimal("150000")) <= 0) {
            tax = BigDecimal.ZERO;
        } else if (M.compareTo(new BigDecimal("233333")) <= 0) {
            tax = M.multiply(new BigDecimal("0.06")).subtract(new BigDecimal("9000"));
        } else if (M.compareTo(new BigDecimal("275000")) <= 0) {
            tax = M.multiply(new BigDecimal("0.18")).subtract(new BigDecimal("37000"));
        } else if (M.compareTo(new BigDecimal("316667")) <= 0) {
            tax = M.multiply(new BigDecimal("0.24")).subtract(new BigDecimal("53500"));
        } else if (M.compareTo(new BigDecimal("358333")) <= 0) {
            tax = M.multiply(new BigDecimal("0.30")).subtract(new BigDecimal("72500"));
        } else {
            tax = M.multiply(new BigDecimal("0.36")).subtract(new BigDecimal("94000"));
        }
        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    // 2. Lump-Sum Payment Tax (Tax Table No. 02)
    // Inputs:
    //   paid (A): total monthly remuneration already paid,
    //   payable (B): total monthly remuneration payable after the current month,
    //   lumpSum (C): lump-sum payment (current + pending),
    //   monthlyTax: tax computed on (A+B) using Table No. 01,
    //   prevLumpTax: tax already deducted on prior lump-sum payments.
    // Define EGAR: D = A + B + C.
    // The rules are:
    //   - If D ≤ 1,800,000:                     Tax = 0
    //   - If 1,800,001 ≤ D ≤ 2,800,000: Tax = (D * 6%)  – [108,000 + (Tax on A+B) + prevLumpTax]
    //   - If 2,800,001 ≤ D ≤ 3,300,000: Tax = (D * 18%) – [444,000 + (Tax on A+B) + prevLumpTax]
    //   - If 3,300,001 ≤ D ≤ 3,800,000: Tax = (D * 24%) – [642,000 + (Tax on A+B) + prevLumpTax]
    //   - If 3,800,001 ≤ D ≤ 4,300,000: Tax = (D * 30%) – [870,000 + (Tax on A+B) + prevLumpTax]
    //   - If D > 4,300,000:              Tax = (D * 36%) – [1,128,000 + (Tax on A+B) + prevLumpTax]
    public BigDecimal calculateLumpSumTax(BigDecimal paid, BigDecimal payable, BigDecimal lumpSum,
                                          BigDecimal monthlyTax, BigDecimal prevLumpTax) {
        BigDecimal D = paid.add(payable).add(lumpSum);
        BigDecimal tax = BigDecimal.ZERO;
        if (D.compareTo(new BigDecimal("1800000")) <= 0) {
            tax = BigDecimal.ZERO;
        } else if (D.compareTo(new BigDecimal("2800000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.06"))
                    .subtract(new BigDecimal("108000").add(monthlyTax).add(prevLumpTax));
        } else if (D.compareTo(new BigDecimal("3300000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.18"))
                    .subtract(new BigDecimal("444000").add(monthlyTax).add(prevLumpTax));
        } else if (D.compareTo(new BigDecimal("3800000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.24"))
                    .subtract(new BigDecimal("642000").add(monthlyTax).add(prevLumpTax));
        } else if (D.compareTo(new BigDecimal("4300000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.30"))
                    .subtract(new BigDecimal("870000").add(monthlyTax).add(prevLumpTax));
        } else {
            tax = D.multiply(new BigDecimal("0.36"))
                    .subtract(new BigDecimal("1128000").add(monthlyTax).add(prevLumpTax));
        }
        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    // 3. Once-and-for-all (Terminal) Payments (Tax Table No. 03)
    // This table provides guidelines (including retention percentages) rather than a direct formula.
    // For implementation, you may need to refer to the detailed guidelines.
    public String getTerminalPaymentGuidelines() {
        return "Please refer to Table No. 03 for guidelines on terminal (once-and-for-all) payments.";
    }

    // 4A. Non-resident, Non-citizen Regular Income Tax (Tax Table No. 04, Part A)
    // M: monthly regular profits.
    // Rules:
    //   - If M ≤ 83,333:              Tax = 6% * M
    //   - If 83,333 < M ≤ 125,000:      Tax = 18% * M – 10,000
    //   - If 125,000 < M ≤ 166,667:     Tax = 24% * M – 17,500
    //   - If 166,667 < M ≤ 208,333:     Tax = 30% * M – 27,500
    //   - If M > 208,333:             Tax = 36% * M – 40,000
    public BigDecimal calculateNonResidentRegularTax(BigDecimal M) {
        BigDecimal tax;
        if (M.compareTo(new BigDecimal("83333")) <= 0) {
            tax = M.multiply(new BigDecimal("0.06"));
        } else if (M.compareTo(new BigDecimal("125000")) <= 0) {
            tax = M.multiply(new BigDecimal("0.18")).subtract(new BigDecimal("10000"));
        } else if (M.compareTo(new BigDecimal("166667")) <= 0) {
            tax = M.multiply(new BigDecimal("0.24")).subtract(new BigDecimal("17500"));
        } else if (M.compareTo(new BigDecimal("208333")) <= 0) {
            tax = M.multiply(new BigDecimal("0.30")).subtract(new BigDecimal("27500"));
        } else {
            tax = M.multiply(new BigDecimal("0.36")).subtract(new BigDecimal("40000"));
        }
        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    // 4B. Non-resident, Non-citizen Lump-Sum Payment Tax (Tax Table No. 04, Part B)
    // Similar to the resident lump-sum method but with different thresholds and offsets.
    public BigDecimal calculateNonResidentLumpSumTax(BigDecimal paid, BigDecimal payable, BigDecimal lumpSum,
                                                     BigDecimal monthlyTax, BigDecimal prevLumpTax) {
        BigDecimal D = paid.add(payable).add(lumpSum);
        BigDecimal tax = BigDecimal.ZERO;
        if (D.compareTo(new BigDecimal("1000000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.06")).subtract(monthlyTax);
        } else if (D.compareTo(new BigDecimal("1500000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.18"))
                    .subtract(new BigDecimal("120000").add(monthlyTax));
        } else if (D.compareTo(new BigDecimal("2000000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.24"))
                    .subtract(new BigDecimal("210000").add(monthlyTax));
        } else if (D.compareTo(new BigDecimal("2500000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.30"))
                    .subtract(new BigDecimal("330000").add(monthlyTax));
        } else {
            tax = D.multiply(new BigDecimal("0.36"))
                    .subtract(new BigDecimal("480000").add(monthlyTax));
        }
        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    // 5. Cumulative Gains and Profits Tax (Tax Table No. 05)
    // G: cumulative income for the year; previousTax: total tax deducted in earlier periods.
    // Rules:
    //   - If G ≤ 1,800,000:         T_cum = 0
    //   - If 1,800,000 < G ≤ 2,800,000: T_cum = 6% * G – 108,000
    //   - If 2,800,000 < G ≤ 3,300,000: T_cum = 18% * G – 444,000
    //   - If 3,300,000 < G ≤ 3,800,000: T_cum = 24% * G – 642,000
    //   - If 3,800,000 < G ≤ 4,300,000: T_cum = 30% * G – 870,000
    //   - If G > 4,300,000:            T_cum = 36% * G – 1,128,000
    // Current period tax = T_cum – previousTax.
    public BigDecimal calculateCumulativeTax(BigDecimal cumulativeIncome, BigDecimal previousTax) {
        BigDecimal T_cum = BigDecimal.ZERO;
        if (cumulativeIncome.compareTo(new BigDecimal("1800000")) <= 0) {
            T_cum = BigDecimal.ZERO;
        } else if (cumulativeIncome.compareTo(new BigDecimal("2800000")) <= 0) {
            T_cum = cumulativeIncome.multiply(new BigDecimal("0.06")).subtract(new BigDecimal("108000"));
        } else if (cumulativeIncome.compareTo(new BigDecimal("3300000")) <= 0) {
            T_cum = cumulativeIncome.multiply(new BigDecimal("0.18")).subtract(new BigDecimal("444000"));
        } else if (cumulativeIncome.compareTo(new BigDecimal("3800000")) <= 0) {
            T_cum = cumulativeIncome.multiply(new BigDecimal("0.24")).subtract(new BigDecimal("642000"));
        } else if (cumulativeIncome.compareTo(new BigDecimal("4300000")) <= 0) {
            T_cum = cumulativeIncome.multiply(new BigDecimal("0.30")).subtract(new BigDecimal("870000"));
        } else {
            T_cum = cumulativeIncome.multiply(new BigDecimal("0.36")).subtract(new BigDecimal("1128000"));
        }
        return T_cum.subtract(previousTax).setScale(2, RoundingMode.HALF_UP);
    }

    // 6. Tax-on-Tax for Monthly Remuneration (Tax Table No. 06, Table 6.1)
    // M: monthly remuneration.
    // Rules:
    //   - If M ≤ 150,000:                      Tax-on-Tax = 0
    //   - If 150,001 ≤ M ≤ 228,333:             = M * 6.38% – 9,570
    //   - If 228,334 ≤ M ≤ 262,500:             = M * 21.95% – 45,119
    //   - If 262,501 ≤ M ≤ 294,167:             = M * 31.58% – 70,398
    //   - If 294,168 ≤ M ≤ 323,333:             = M * 42.86% – 103,580
    //   - If M ≥ 323,334:                       = M * 56.25% – 146,875
    public BigDecimal calculateMonthlyTaxOnTax(BigDecimal M) {
        BigDecimal tax;
        if (M.compareTo(new BigDecimal("150000")) <= 0) {
            tax = BigDecimal.ZERO;
        } else if (M.compareTo(new BigDecimal("228333")) <= 0) {
            tax = M.multiply(new BigDecimal("0.0638")).subtract(new BigDecimal("9570"));
        } else if (M.compareTo(new BigDecimal("262500")) <= 0) {
            tax = M.multiply(new BigDecimal("0.2195")).subtract(new BigDecimal("45119"));
        } else if (M.compareTo(new BigDecimal("294167")) <= 0) {
            tax = M.multiply(new BigDecimal("0.3158")).subtract(new BigDecimal("70398"));
        } else if (M.compareTo(new BigDecimal("323333")) <= 0) {
            tax = M.multiply(new BigDecimal("0.4286")).subtract(new BigDecimal("103580"));
        } else {
            tax = M.multiply(new BigDecimal("0.5625")).subtract(new BigDecimal("146875"));
        }
        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    // 6B. Lump-Sum Tax-on-Tax for cumulative payments
    // Similar to the lump-sum tax method but using Tax Table 6.2.
    public BigDecimal calculateLumpSumTaxOnTax(BigDecimal paid, BigDecimal payable, BigDecimal lumpSum,
                                               BigDecimal taxOnTaxMonthly, BigDecimal prevLumpTaxOnTax) {
        BigDecimal D = paid.add(payable).add(lumpSum);
        BigDecimal tax;
        if (D.compareTo(new BigDecimal("1800000")) <= 0) {
            tax = BigDecimal.ZERO;
        } else if (D.compareTo(new BigDecimal("2740000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.0638"))
                    .subtract(new BigDecimal("114840").add(taxOnTaxMonthly).add(prevLumpTaxOnTax));
        } else if (D.compareTo(new BigDecimal("3150000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.2195"))
                    .subtract(new BigDecimal("541430").add(taxOnTaxMonthly).add(prevLumpTaxOnTax));
        } else if (D.compareTo(new BigDecimal("3530000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.3158"))
                    .subtract(new BigDecimal("844770").add(taxOnTaxMonthly).add(prevLumpTaxOnTax));
        } else if (D.compareTo(new BigDecimal("3880000")) <= 0) {
            tax = D.multiply(new BigDecimal("0.4286"))
                    .subtract(new BigDecimal("1247958").add(taxOnTaxMonthly).add(prevLumpTaxOnTax));
        } else {
            tax = D.multiply(new BigDecimal("0.5625"))
                    .subtract(new BigDecimal("1762500").add(taxOnTaxMonthly).add(prevLumpTaxOnTax));
        }
        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    // 7A. Secondary Employment Tax for Resident Employees (Tax Table No. 07, Part A)
    // Let P = primary employment income, S = secondary employment income.
    // If (P+S) < 150,000, then tax on secondary = 0.
    // Otherwise, the rate on S depends on P:
    //   - If P ≤ 150,000:         rate = 6%
    //   - If 150,001 ≤ P ≤ 233,333: rate = 18%
    //   - If 233,334 ≤ P ≤ 275,000: rate = 24%
    //   - If 275,001 ≤ P ≤ 358,333: rate = 30%
    //   - If P ≥ 358,334:           rate = 36%
    public BigDecimal calculateSecondaryEmploymentTaxForResident(BigDecimal primaryIncome, BigDecimal secondaryIncome) {
        if (primaryIncome.add(secondaryIncome).compareTo(new BigDecimal("150000")) < 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate;
        if (primaryIncome.compareTo(new BigDecimal("150000")) <= 0) {
            rate = new BigDecimal("0.06");
        } else if (primaryIncome.compareTo(new BigDecimal("233333")) <= 0) {
            rate = new BigDecimal("0.18");
        } else if (primaryIncome.compareTo(new BigDecimal("275000")) <= 0) {
            rate = new BigDecimal("0.24");
        } else if (primaryIncome.compareTo(new BigDecimal("358333")) <= 0) {
            rate = new BigDecimal("0.30");
        } else {
            rate = new BigDecimal("0.36");
        }
        return secondaryIncome.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    // 7B. Secondary Employment Tax for Non-Resident Employees (Tax Table No. 07, Part B)
    public BigDecimal calculateSecondaryEmploymentTaxForNonResident(BigDecimal secondaryIncome) {
        return secondaryIncome.multiply(new BigDecimal("0.36")).setScale(2, RoundingMode.HALF_UP);
    }

    // 8. Income from a Foreign Employer (Tax Table No. 08)
    // Let D be the cumulative employment income (converted to Rs.) for the year.
    // If D ≤ 1,800,000 then Tax = 0; otherwise, total tax liability = (D * 15%) – 360,000.
    // The current month’s tax is the difference between the current total liability and the liability already paid.
    public BigDecimal calculateForeignEmployerTax(BigDecimal cumulativeIncome, BigDecimal previousTax) {
        BigDecimal totalTaxLiability;
        if (cumulativeIncome.compareTo(new BigDecimal("1800000")) <= 0) {
            totalTaxLiability = BigDecimal.ZERO;
        } else {
            totalTaxLiability = cumulativeIncome.multiply(new BigDecimal("0.15")).subtract(new BigDecimal("360000"));
        }
        return totalTaxLiability.subtract(previousTax).setScale(2, RoundingMode.HALF_UP);
    }
}

