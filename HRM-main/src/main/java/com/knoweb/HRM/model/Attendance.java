package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.io.Serializable;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.Locale;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "attendance")
public class Attendance implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "atdnc_id")
    private long id;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    @Column(name = "emp_id")
    private long empId;

    private String working_status;

    @Column(name = "total_time")
    private float totalTime;

    private String attendance_status;


    @Column(name = "day_name")
    private String dayName;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "atdnc_id", referencedColumnName = "atdnc_id", insertable = false, updatable = false)
    private Additional_attendance additional_attendance;


    @PrePersist
    @PreUpdate
    public void calculateTotalTime() {
        if (this.startedAt != null) {
            this.dayName = this.startedAt.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase();
        }
        if (this.startedAt != null && this.endedAt != null) {
            Duration duration = Duration.between(this.startedAt, this.endedAt);
            this.totalTime = duration.toMinutes();
        } else {
            this.totalTime = 0;
        }
    }
}
