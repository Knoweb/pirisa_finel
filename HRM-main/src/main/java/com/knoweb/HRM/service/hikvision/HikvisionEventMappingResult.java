package com.knoweb.HRM.service.hikvision;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HikvisionEventMappingResult {
    private long eventId;
    private long employeeId;
    private int reprocessed;
}
