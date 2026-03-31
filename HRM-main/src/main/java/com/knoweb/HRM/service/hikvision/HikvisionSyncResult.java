package com.knoweb.HRM.service.hikvision;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HikvisionSyncResult {
    private int fetched;
    private int stored;
    private int processed;
    private int unresolved;
    private int rawDuplicates;
    private long lastSerialNo;
}
