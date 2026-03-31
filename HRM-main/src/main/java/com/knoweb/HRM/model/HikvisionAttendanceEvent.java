package com.knoweb.HRM.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hikvision_attendance_event")
public class HikvisionAttendanceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private long serialNo;

    private int majorCode;

    private int minorCode;

    private LocalDateTime eventTime;

    private String verifyMode;

    @Column(length = 500)
    private String employeeRef;

    @Column(length = 500)
    private String personNameRef;

    private Long resolvedEmpId;

    private boolean processed;

    @Column(length = 1000)
    private String notes;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
