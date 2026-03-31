package com.knoweb.HRM.service.hikvision;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HikvisionProvisioningResult {

    private String status;
    private String error;

    public HikvisionProvisioningResult() {
    }

    public HikvisionProvisioningResult(String status, String error) {
        this.status = status;
        this.error = error;
    }

    public static HikvisionProvisioningResult synced() {
        return new HikvisionProvisioningResult("SYNCED", null);
    }

    public static HikvisionProvisioningResult failed(String error) {
        return new HikvisionProvisioningResult("FAILED", error);
    }

    public static HikvisionProvisioningResult pending(String reason) {
        return new HikvisionProvisioningResult("PENDING", reason);
    }
}
