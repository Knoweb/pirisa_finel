package com.knoweb.HRM.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hikvision_sync_state")
public class HikvisionSyncState {

    @Id
    private String syncKey;

    private LocalDateTime lastEventTime;

    private long lastSerialNo;

    private LocalDateTime lastSuccessAt;

    private String lastStatus;

    @Column(length = 2000)
    private String lastError;
}
