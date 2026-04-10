package com.knoweb.HRM.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PayroleDTO {

    private Long id;

    private int year;

    private String month;

    private String allowance;

    private float overtime_pay;

    private String bonus_pay;

    private float appit;

    private float loan;

    private float other_deductions;
    
    private float advance_deduction;

    private float epf_8;

    private float total_earnings;

    private float total_deductions;

    private float net_salary;

    private float basic_salary;

}
