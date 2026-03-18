package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "employeeleave")
public class EmployeeLeave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "empleave_id")
    private long id;

    private String leaveType;

    private LocalDateTime leaveStartDay;

    private LocalDateTime leaveEndDay;

    private int leaveDays;

    private String leaveReason;

    private String leaveStatus = "PENDING";

    @Column(name = "emp_id")
    private long empId;

    @Column(name = "cancellation_date")
    private LocalDateTime cancellationDate;

    @Column(name = "canceled_by")
    private String canceledBy;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @PrePersist
    @PreUpdate
    public void calculateLeaveDays() {
        if (leaveStartDay != null && leaveEndDay != null) {
            this.leaveDays = (int) ChronoUnit.DAYS.between(leaveStartDay, leaveEndDay) + 1;
        }
    }
}
