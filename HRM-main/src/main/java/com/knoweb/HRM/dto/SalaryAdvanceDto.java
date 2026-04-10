package com.knoweb.HRM.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SalaryAdvanceDto {

    private long id;
    private String employeeId;
    private LocalDateTime requestDate;
    private double amountRequested;
    private String approvedBy;
    private String repaymentDeductionMonth;
    private String status;
    private Long cmpId;
    private String remarks;

}