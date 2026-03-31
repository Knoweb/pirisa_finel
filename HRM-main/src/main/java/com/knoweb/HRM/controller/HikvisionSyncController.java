package com.knoweb.HRM.controller;

import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.HikvisionSyncState;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.service.hikvision.HikvisionEventMappingResult;
import com.knoweb.HRM.service.hikvision.HikvisionProvisioningService;
import com.knoweb.HRM.service.hikvision.HikvisionProvisioningResult;
import com.knoweb.HRM.service.hikvision.HikvisionSyncResult;
import com.knoweb.HRM.service.hikvision.HikvisionSyncService;
import com.knoweb.HRM.service.hikvision.HikvisionUnresolvedEventDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/integration/hikvision")
public class HikvisionSyncController {

    private final HikvisionSyncService hikvisionSyncService;
    private final HikvisionProvisioningService hikvisionProvisioningService;
    private final EmployeeRepository employeeRepository;

    public HikvisionSyncController(HikvisionSyncService hikvisionSyncService,
                                   HikvisionProvisioningService hikvisionProvisioningService,
                                   EmployeeRepository employeeRepository) {
        this.hikvisionSyncService = hikvisionSyncService;
        this.hikvisionProvisioningService = hikvisionProvisioningService;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<HikvisionSyncState> status() {
        return ResponseEntity.ok(hikvisionSyncService.getStatus());
    }

    @GetMapping("/unresolved-events")
    public ResponseEntity<List<HikvisionUnresolvedEventDto>> unresolvedEvents() {
        return ResponseEntity.ok(hikvisionSyncService.getUnresolvedEvents());
    }

    @PostMapping("/sync-now")
    public ResponseEntity<?> syncNow() throws IOException {
        HikvisionSyncResult result = hikvisionSyncService.syncNow();
        Map<String, Object> response = new HashMap<>();
        response.put("resultCode", 100);
        response.put("resultDesc", "Hikvision sync completed");
        response.put("details", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/map-event/{eventId}/employee/{employeeId}")
    public ResponseEntity<?> mapEvent(@PathVariable long eventId, @PathVariable long employeeId) {
        HikvisionEventMappingResult result = hikvisionSyncService.mapEventToEmployee(eventId, employeeId);
        Map<String, Object> response = new HashMap<>();
        response.put("resultCode", 100);
        response.put("resultDesc", "Hikvision event mapped to employee");
        response.put("details", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/employee/{employeeId}/sync")
    public ResponseEntity<?> syncEmployee(@PathVariable long employeeId) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
            HikvisionProvisioningResult result = hikvisionProvisioningService.syncEmployeeToDevice(employee);
            employee.setDeviceSyncStatus(result.getStatus());
            employee.setDeviceSyncError(result.getError());
            employee.setDeviceSyncAt(LocalDateTime.now());
            employeeRepository.saveAndFlush(employee);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Employee sync attempted");
            response.put("employeeId", employeeId);
            response.put("deviceSyncStatus", result.getStatus());
            response.put("deviceSyncError", result.getError());
            return ResponseEntity.ok(response);
        } catch (Exception exception) {
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 101);
            response.put("resultDesc", "Employee sync failed");
            response.put("employeeId", employeeId);
            response.put("error", exception.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
