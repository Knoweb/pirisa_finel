package com.knoweb.HRM.service.hikvision;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HikvisionUnresolvedEventDto {
    private long id;
    private long serialNo;
    private LocalDateTime eventTime;
    private String employeeRef;
    private String personNameRef;
    private String verifyMode;
    private String notes;
}
