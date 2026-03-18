package com.knoweb.HRM.model;

import java.math.BigDecimal;

public class TaxResponse {
    private String description;
    private BigDecimal result;

    public TaxResponse(String description, BigDecimal result) {
        this.description = description;
        this.result = result;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getResult() {
        return result;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setResult(BigDecimal result) {
        this.result = result;
    }
}
