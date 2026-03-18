package com.knoweb.HRM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceResponseDTO {
    private int resultCode;
    private String resultDesc;

    private Long empId;
    private Long cmpId;

    private String asOfMode;
    private LocalDate asOfDate;
    private LocalDate lastCalculationDate;

    private List<LeavePlanBalanceDTO> planBalances;
}
