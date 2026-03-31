package com.knoweb.HRM.service.hikvision;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
public class HikvisionEventRecord {
    private long serialNo;
    private int majorCode;
    private int minorCode;
    private String verifyMode;
    private String employeeRef;
    private String personNameRef;
    private OffsetDateTime eventTime;
}
