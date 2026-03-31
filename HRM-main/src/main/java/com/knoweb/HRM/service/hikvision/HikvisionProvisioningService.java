package com.knoweb.HRM.service.hikvision;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.knoweb.HRM.config.HikvisionSyncProperties;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.HikvisionIdentityMapping;
import com.knoweb.HRM.repository.HikvisionIdentityMappingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class HikvisionProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(HikvisionProvisioningService.class);
    private static final String EMPLOYEE_REF = "EMPLOYEE_REF";
    private static final String PERSON_NAME_REF = "PERSON_NAME_REF";
    private static final DateTimeFormatter HIKVISION_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final HikvisionSyncProperties properties;
    private final HikvisionDigestClient hikvisionDigestClient;
    private final HikvisionIdentityMappingRepository identityMappingRepository;
    private final ObjectMapper objectMapper;

    public HikvisionProvisioningService(HikvisionSyncProperties properties,
                                        HikvisionDigestClient hikvisionDigestClient,
                                        HikvisionIdentityMappingRepository identityMappingRepository,
                                        ObjectMapper objectMapper) {
        this.properties = properties;
        this.hikvisionDigestClient = hikvisionDigestClient;
        this.identityMappingRepository = identityMappingRepository;
        this.objectMapper = objectMapper;
    }

    public HikvisionProvisioningResult syncEmployeeToDevice(Employee employee) {
        String employeeCode = resolveEmployeeCode(employee);
        String displayName = resolveDisplayName(employee);

        if (employeeCode == null) {
            log.warn("Skipping Hikvision employee sync because no employee code is available for empId={}", employee.getId());
            return HikvisionProvisioningResult.failed("No employee code available for device sync");
        }

        seedMapping(EMPLOYEE_REF, employeeCode, employee.getId());
        seedMapping(PERSON_NAME_REF, displayName, employee.getId());

        if (!properties.isEnabled()) {
            return HikvisionProvisioningResult.pending("Hikvision sync is disabled");
        }

        try {
            JsonNode payload = buildUserPayload(employee, employeeCode, displayName);
            hikvisionDigestClient.putJson("/ISAPI/AccessControl/UserInfo/SetUp?format=json", payload);
            log.info("Synced employee {} to Hikvision device with code {}", employee.getId(), employeeCode);
            return HikvisionProvisioningResult.synced();
        } catch (Exception exception) {
            log.warn("Failed to sync employee {} to Hikvision device: {}", employee.getId(), exception.getMessage());
            return HikvisionProvisioningResult.failed(exception.getMessage());
        }
    }

    private JsonNode buildUserPayload(Employee employee, String employeeCode, String displayName) {
        String beginDate = LocalDate.now()
                .atStartOfDay()
                .format(HIKVISION_DATE_TIME_FORMATTER);
        String endDate = LocalDateTime.of(LocalDate.of(2037, 12, 31), LocalTime.of(23, 59, 59))
                .format(HIKVISION_DATE_TIME_FORMATTER);

        ObjectNode validNode = objectMapper.createObjectNode();
        validNode.put("enable", true);
        validNode.put("beginTime", beginDate);
        validNode.put("endTime", endDate);
        validNode.put("timeType", "local");

        ObjectNode rightPlanEntry = objectMapper.createObjectNode();
        rightPlanEntry.put("doorNo", parsePositiveInteger(properties.getDefaultDoorNo(), 1));
        rightPlanEntry.put("planTemplateNo", properties.getDefaultPlanTemplateNo());

        ArrayNode rightPlan = objectMapper.createArrayNode();
        rightPlan.add(rightPlanEntry);

        ObjectNode userInfo = objectMapper.createObjectNode();
        userInfo.put("employeeNo", employeeCode);
        userInfo.put("name", displayName);
        userInfo.put("userType", "normal");
        userInfo.put("gender", normalizeGender(employee.getGender()));
        userInfo.put("doorRight", properties.getDefaultDoorRight());
        userInfo.put("userVerifyMode", properties.getDefaultVerifyMode());
        userInfo.put("localUIRight", false);
        userInfo.put("maxOpenDoorTime", 0);
        userInfo.put("openDoorTime", 0);
        userInfo.set("Valid", validNode);
        userInfo.set("RightPlan", rightPlan);

        ObjectNode root = objectMapper.createObjectNode();
        root.set("UserInfo", userInfo);
        return root;
    }

    private String resolveEmployeeCode(Employee employee) {
        if (hasText(employee.getEmp_no())) {
            return employee.getEmp_no().trim();
        }
        if (hasText(employee.getEpf_no())) {
            return employee.getEpf_no().trim();
        }
        if (hasText(employee.getUsername())) {
            return employee.getUsername().trim();
        }
        return null;
    }

    private String resolveDisplayName(Employee employee) {
        String firstName = employee.getFirst_name() == null ? "" : employee.getFirst_name().trim();
        String lastName = employee.getLast_name() == null ? "" : employee.getLast_name().trim();
        String fullName = (firstName + " " + lastName).trim();
        if (!fullName.isBlank()) {
            return fullName;
        }
        if (hasText(employee.getUsername())) {
            return employee.getUsername().trim();
        }
        return "Employee " + employee.getId();
    }

    private String normalizeGender(String gender) {
        if (gender == null) {
            return "unknown";
        }
        String normalized = gender.trim().toLowerCase();
        if ("male".equals(normalized) || "female".equals(normalized)) {
            return normalized;
        }
        return "unknown";
    }

    private void seedMapping(String mappingType, String mappingKey, long employeeId) {
        if (!hasText(mappingKey)) {
            return;
        }
        HikvisionIdentityMapping mapping = identityMappingRepository
                .findByMappingTypeAndMappingKey(mappingType, mappingKey)
                .orElseGet(HikvisionIdentityMapping::new);
        mapping.setMappingType(mappingType);
        mapping.setMappingKey(mappingKey.trim());
        mapping.setEmployeeId(employeeId);
        identityMappingRepository.save(mapping);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private int parsePositiveInteger(String value, int fallback) {
        if (!hasText(value)) {
            return fallback;
        }
        try {
            int parsed = Integer.parseInt(value.trim());
            return parsed > 0 ? parsed : fallback;
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }
}
