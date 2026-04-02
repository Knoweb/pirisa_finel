package com.knoweb.HRM.service.hikvision;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.config.HikvisionSyncProperties;
import com.knoweb.HRM.model.Attendance;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.HikvisionAttendanceEvent;
import com.knoweb.HRM.model.HikvisionIdentityMapping;
import com.knoweb.HRM.model.HikvisionSyncState;
import com.knoweb.HRM.repository.AttendanceRepository;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.repository.HikvisionAttendanceEventRepository;
import com.knoweb.HRM.repository.HikvisionIdentityMappingRepository;
import com.knoweb.HRM.repository.HikvisionSyncStateRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class HikvisionSyncService {

    private static final String SYNC_KEY_PREFIX = "hikvision-company-";
    private static final String EMPLOYEE_REF = "EMPLOYEE_REF";
    private static final String PERSON_NAME_REF = "PERSON_NAME_REF";

    private final HikvisionSyncProperties properties;
    private final HikvisionDigestClient hikvisionDigestClient;
    private final HikvisionSyncStateRepository syncStateRepository;
    private final HikvisionAttendanceEventRepository rawEventRepository;
    private final HikvisionIdentityMappingRepository identityMappingRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final com.knoweb.HRM.repository.CompanyRepository companyRepository;
    private final ObjectMapper objectMapper;

    public HikvisionSyncService(HikvisionSyncProperties properties,
                                HikvisionDigestClient hikvisionDigestClient,
                                HikvisionSyncStateRepository syncStateRepository,
                                HikvisionAttendanceEventRepository rawEventRepository,
                                HikvisionIdentityMappingRepository identityMappingRepository,
                                EmployeeRepository employeeRepository,
                                AttendanceRepository attendanceRepository,
                                com.knoweb.HRM.repository.CompanyRepository companyRepository,
                                ObjectMapper objectMapper) {
        this.properties = properties;
        this.hikvisionDigestClient = hikvisionDigestClient;
        this.syncStateRepository = syncStateRepository;
        this.rawEventRepository = rawEventRepository;
        this.identityMappingRepository = identityMappingRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.companyRepository = companyRepository;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelayString = "#{${hikvision.sync.poll-minutes:1} * 60000}")
    public void scheduledSync() {
        if (!properties.isEnabled()) {
            return;
        }
        List<com.knoweb.HRM.model.Company> companies = companyRepository.findAll();
        for (com.knoweb.HRM.model.Company company : companies) {
            if (company.isHikvisionEnabled() && company.getHikvisionBaseUrl() != null && !company.getHikvisionBaseUrl().isBlank()) {
                try {
                    syncNow(company);
                } catch (Exception exception) {
                    String syncKey = SYNC_KEY_PREFIX + company.getId();
                    HikvisionSyncState state = syncStateRepository.findById(syncKey).orElseGet(() -> newState(syncKey));
                    state.setLastStatus("ERROR");
                    state.setLastError(exception.getMessage());
                    syncStateRepository.save(state);
                }
            }
        }
    }

    @Transactional
    public HikvisionSyncResult syncNow(com.knoweb.HRM.model.Company company) throws IOException {
        String syncKey = SYNC_KEY_PREFIX + company.getId();
        HikvisionSyncState state = syncStateRepository.findById(syncKey).orElseGet(() -> newState(syncKey));
        
        HikvisionDigestClient.DeviceConfig config = new HikvisionDigestClient.DeviceConfig(
                company.getHikvisionBaseUrl(),
                company.getHikvisionUsername(),
                company.getHikvisionPassword()
        );

        List<HikvisionEventRecord> events = fetchEvents(state, config);

        HikvisionSyncResult result = new HikvisionSyncResult();
        result.setFetched(events.size());

        long maxSerial = state.getLastSerialNo();
        LocalDateTime lastEventTime = state.getLastEventTime();
        int stored = 0;
        int processed = 0;
        int unresolved = 0;
        int rawDuplicates = 0;

        for (HikvisionEventRecord event : events) {
            maxSerial = Math.max(maxSerial, event.getSerialNo());
            if (!isAttendanceAuthEvent(event)) {
                continue;
            }
            if (rawEventRepository.existsBySerialNo(event.getSerialNo())) {
                rawDuplicates++;
                continue;
            }

            HikvisionAttendanceEvent rawEvent = toRawEvent(event);
            if (resolveAndApplyAttendance(rawEvent, rawEvent.getEventTime())) {
                processed++;
            } else {
                unresolved++;
            }

            rawEventRepository.save(rawEvent);
            stored++;
            lastEventTime = rawEvent.getEventTime();
        }

        state.setLastSerialNo(maxSerial);
        state.setLastEventTime(lastEventTime);
        state.setLastSuccessAt(LocalDateTime.now());
        state.setLastStatus("OK");
        state.setLastError(null);
        syncStateRepository.save(state);

        result.setStored(stored);
        result.setProcessed(processed);
        result.setUnresolved(unresolved);
        result.setRawDuplicates(rawDuplicates);
        result.setLastSerialNo(maxSerial);
        return result;
    }

    public HikvisionSyncState getStatus(long companyId) {
        String syncKey = SYNC_KEY_PREFIX + companyId;
        return syncStateRepository.findById(syncKey).orElseGet(() -> newState(syncKey));
    }

    public List<HikvisionUnresolvedEventDto> getUnresolvedEvents() {
        List<HikvisionUnresolvedEventDto> result = new ArrayList<>();
        for (HikvisionAttendanceEvent event : rawEventRepository.findTop100ByProcessedFalseOrderByEventTimeDesc()) {
            HikvisionUnresolvedEventDto dto = new HikvisionUnresolvedEventDto();
            dto.setId(event.getId());
            dto.setSerialNo(event.getSerialNo());
            dto.setEventTime(event.getEventTime());
            dto.setEmployeeRef(event.getEmployeeRef());
            dto.setPersonNameRef(event.getPersonNameRef());
            dto.setVerifyMode(event.getVerifyMode());
            dto.setNotes(event.getNotes());
            result.add(dto);
        }
        return result;
    }

    @Transactional
    public HikvisionEventMappingResult mapEventToEmployee(long eventId, long employeeId) {
        HikvisionAttendanceEvent sourceEvent = rawEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Hikvision raw event not found"));
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        createOrUpdateMapping(EMPLOYEE_REF, sourceEvent.getEmployeeRef(), employee.getId());
        createOrUpdateMapping(PERSON_NAME_REF, sourceEvent.getPersonNameRef(), employee.getId());

        int reprocessed = 0;
        for (HikvisionAttendanceEvent unresolvedEvent : rawEventRepository.findUnresolvedEventsForRefs(
                sourceEvent.getEmployeeRef(),
                sourceEvent.getPersonNameRef())) {
            if (resolveAndApplyAttendance(unresolvedEvent, unresolvedEvent.getEventTime())) {
                rawEventRepository.save(unresolvedEvent);
                reprocessed++;
            }
        }

        HikvisionEventMappingResult result = new HikvisionEventMappingResult();
        result.setEventId(eventId);
        result.setEmployeeId(employeeId);
        result.setReprocessed(reprocessed);
        return result;
    }

    private HikvisionSyncState newState(String syncKey) {
        HikvisionSyncState state = new HikvisionSyncState();
        state.setSyncKey(syncKey);
        state.setLastStatus("IDLE");
        state.setLastSerialNo(0);
        return state;
    }

    private List<HikvisionEventRecord> fetchEvents(HikvisionSyncState state, HikvisionDigestClient.DeviceConfig config) throws IOException {
        List<HikvisionEventRecord> records = new ArrayList<>();
        String searchId = UUID.randomUUID().toString().replace("-", "");
        int position = 0;

        while (true) {
            JsonNode body = objectMapper.createObjectNode()
                    .set("AcsEventCond", objectMapper.createObjectNode()
                            .put("searchID", searchId)
                            .put("searchResultPosition", position)
                            .put("maxResults", properties.getMaxResults())
                            .put("major", 0)
                            .put("minor", 0)
                            .put("startTime", resolveStartTime(state))
                            .put("endTime", resolveEndTime())
                            .put("timeReverseOrder", true));

            JsonNode response = hikvisionDigestClient.postJson("/ISAPI/AccessControl/AcsEvent?format=json", body, config);
            JsonNode acsEvent = response.path("AcsEvent");
            JsonNode infoList = acsEvent.path("InfoList");
            if (!infoList.isArray() || infoList.isEmpty()) {
                break;
            }

            for (JsonNode node : infoList) {
                HikvisionEventRecord record = new HikvisionEventRecord();
                record.setSerialNo(node.path("serialNo").asLong());
                record.setMajorCode(node.path("major").asInt());
                record.setMinorCode(node.path("minor").asInt());
                record.setVerifyMode(node.path("currentVerifyMode").asText(null));
                record.setEmployeeRef(trimToNull(node.path("employeeNoString").asText(null)));
                record.setPersonNameRef(trimToNull(node.path("name").asText(null)));
                if (node.hasNonNull("time")) {
                    record.setEventTime(OffsetDateTime.parse(node.path("time").asText()));
                }
                if (record.getSerialNo() > state.getLastSerialNo()) {
                    records.add(record);
                }
            }

            String responseStatus = acsEvent.path("responseStatusStrg").asText("");
            if (!"MORE".equalsIgnoreCase(responseStatus) || infoList.size() < properties.getMaxResults()) {
                break;
            }
            position += infoList.size();
        }

        records.sort(Comparator.comparingLong(HikvisionEventRecord::getSerialNo));
        return records;
    }

    private String resolveStartTime(HikvisionSyncState state) {
        OffsetDateTime start = state.getLastEventTime() != null
                ? state.getLastEventTime()
                .minusMinutes(properties.getDuplicateWindowMinutes())
                .toLocalDate()
                .atStartOfDay()
                .atOffset(OffsetDateTime.now().getOffset())
                : OffsetDateTime.now().toLocalDate().atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        return start.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    private String resolveEndTime() {
        return OffsetDateTime.now()
                .toLocalDate()
                .atTime(LocalTime.of(23, 59, 59))
                .atOffset(OffsetDateTime.now().getOffset())
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    private boolean isAttendanceAuthEvent(HikvisionEventRecord event) {
        return event.getMajorCode() == 5 && event.getMinorCode() == 38;
    }

    private HikvisionAttendanceEvent toRawEvent(HikvisionEventRecord event) {
        HikvisionAttendanceEvent rawEvent = new HikvisionAttendanceEvent();
        rawEvent.setSerialNo(event.getSerialNo());
        rawEvent.setMajorCode(event.getMajorCode());
        rawEvent.setMinorCode(event.getMinorCode());
        rawEvent.setEventTime(event.getEventTime().toLocalDateTime());
        rawEvent.setVerifyMode(event.getVerifyMode());
        rawEvent.setEmployeeRef(event.getEmployeeRef());
        rawEvent.setPersonNameRef(event.getPersonNameRef());
        return rawEvent;
    }

    private boolean resolveAndApplyAttendance(HikvisionAttendanceEvent rawEvent, LocalDateTime eventTime) {
        Optional<Employee> employeeOptional = resolveEmployee(rawEvent.getEmployeeRef(), rawEvent.getPersonNameRef());
        if (employeeOptional.isEmpty()) {
            rawEvent.setProcessed(false);
            rawEvent.setResolvedEmpId(null);
            rawEvent.setNotes("Employee mapping not resolved from device payload");
            return false;
        }

        Employee employee = employeeOptional.get();
        rawEvent.setResolvedEmpId(employee.getId());
        rawEvent.setProcessed(true);
        rawEvent.setNotes(null);
        upsertAttendance(employee, eventTime);
        return true;
    }

    private Optional<Employee> resolveEmployee(String employeeRef, String personNameRef) {
        Optional<Employee> mappedEmployee = resolveMappedEmployee(EMPLOYEE_REF, employeeRef);
        if (mappedEmployee.isPresent()) {
            return mappedEmployee;
        }

        mappedEmployee = resolveMappedEmployee(PERSON_NAME_REF, personNameRef);
        if (mappedEmployee.isPresent()) {
            return mappedEmployee;
        }

        if (employeeRef != null) {
            Optional<Employee> byCode = employeeRepository.findByDeviceCode(employeeRef);
            if (byCode.isPresent()) {
                return byCode;
            }
        }
        if (personNameRef != null) {
            Optional<Employee> byCode = employeeRepository.findByDeviceCode(personNameRef);
            if (byCode.isPresent()) {
                return byCode;
            }
        }
        return Optional.empty();
    }

    private Optional<Employee> resolveMappedEmployee(String mappingType, String mappingKey) {
        if (mappingKey == null) {
            return Optional.empty();
        }
        return identityMappingRepository.findByMappingTypeAndMappingKey(mappingType, mappingKey)
                .flatMap(mapping -> employeeRepository.findById(mapping.getEmployeeId()));
    }

    private void createOrUpdateMapping(String mappingType, String mappingKey, long employeeId) {
        if (mappingKey == null) {
            return;
        }
        HikvisionIdentityMapping mapping = identityMappingRepository.findByMappingTypeAndMappingKey(mappingType, mappingKey)
                .orElseGet(HikvisionIdentityMapping::new);
        mapping.setMappingType(mappingType);
        mapping.setMappingKey(mappingKey);
        mapping.setEmployeeId(employeeId);
        identityMappingRepository.save(mapping);
    }

    private void upsertAttendance(Employee employee, LocalDateTime eventTime) {
        List<Attendance> openAttendances = attendanceRepository.findOpenAttendances(employee.getId());
        Attendance openAttendance = openAttendances.isEmpty() ? null : openAttendances.get(0);

        if (openAttendance == null) {
            Attendance attendance = new Attendance();
            attendance.setEmpId(employee.getId());
            attendance.setStartedAt(eventTime);
            attendance.setWorking_status("On-Site");
            attendance.setAttendance_status("ACTIVE");
            attendanceRepository.save(attendance);
            return;
        }

        long minutesSinceStart = Math.abs(Duration.between(openAttendance.getStartedAt(), eventTime).toMinutes());
        if (minutesSinceStart <= properties.getDuplicateWindowMinutes()) {
            return;
        }

        if (eventTime.toLocalDate().equals(openAttendance.getStartedAt().toLocalDate())) {
            openAttendance.setEndedAt(eventTime);
            openAttendance.setAttendance_status("PRESENT");
            attendanceRepository.save(openAttendance);
            return;
        }

        Attendance attendance = new Attendance();
        attendance.setEmpId(employee.getId());
        attendance.setStartedAt(eventTime);
        attendance.setWorking_status("On-Site");
        attendance.setAttendance_status("ACTIVE");
        attendanceRepository.save(attendance);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
