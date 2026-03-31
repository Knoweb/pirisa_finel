package com.knoweb.HRM.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "hikvision.sync")
public class HikvisionSyncProperties {

    private boolean enabled = false;
    private String baseUrl;
    private String username;
    private String password;
    private int pollMinutes = 5;
    private int maxResults = 30;
    private int duplicateWindowMinutes = 2;
    private boolean trustSelfSigned = true;

    private String defaultDoorRight = "1";
    private String defaultDoorNo = "1";
    private String defaultPlanTemplateNo = "1";
    private String defaultVerifyMode = "faceOrFpOrCardOrPw";
}
