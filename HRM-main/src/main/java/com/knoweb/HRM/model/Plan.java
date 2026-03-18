package com.knoweb.HRM.model;

public enum Plan {
    BASIC(20),
    STANDARD(50),
    PREMIUM(100),
    ENTERPRISE(Integer.MAX_VALUE);

    private final int maxEmployees;

    Plan(int maxEmployees) {
        this.maxEmployees = maxEmployees;
    }

    public int getMaxEmployees() {
        return maxEmployees;
    }
}
