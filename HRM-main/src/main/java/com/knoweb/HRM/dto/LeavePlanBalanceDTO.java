package com.knoweb.HRM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeavePlanBalanceDTO {
    private String leaveType;
    private int available;
    private int taken;
    private int remaining;
    private LocalDate calculatedOn;
}
