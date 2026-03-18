package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.time.Duration;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "companyotdetails")
public class CompanyOTDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cmpot_id")
    private long id;

    private LocalTime company_start_time;

    private LocalTime company_end_time;

    private double normal_ot_rate;

    private double holiday_ot_rate;

    private int OT_cal;

    @Column(name = "total_time")
    private float totalTime;

    @Column(name = "cmp_id" , unique = true)
    private long cmpId;

    @PrePersist
    @PreUpdate
    public void calculateTotalTime() {
        if (company_start_time != null && company_end_time != null) {
            this.totalTime = Duration.between(company_start_time, company_end_time).toHours();
        }
    }
}

