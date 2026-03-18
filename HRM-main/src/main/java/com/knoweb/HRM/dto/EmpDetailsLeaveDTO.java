package com.knoweb.HRM.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class EmpDetailsLeaveDTO {

    private Long id;
    private String leaveType;
    private String leaveReason;
    private String leaveStatus;
    private LocalDateTime leaveStartDay;
    private LocalDateTime leaveEndDay;
    private int leaveDays;
}
