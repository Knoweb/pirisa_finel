package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payrole")
public class Payrole implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payrole_id")
    private long id;

    private int year;

    private String month;

    private String allowance;

    private float overtime_pay;

    private String bonus_pay;

    private float appit;

    private float loan;

    private float other_deductions;
    
    @Column(name = "advance_deduction", nullable = true, columnDefinition = "float default 0.0")
    private float advance_deduction;

    private float epf_8;

    private float total_earnings;

    private float total_deductions;

    private float net_salary;

    private float basic_salary;

    @Column(name = "emp_id")
    private long empId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

}
