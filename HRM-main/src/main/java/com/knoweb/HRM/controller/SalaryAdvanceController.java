package com.knoweb.HRM.controller;

import com.knoweb.HRM.dto.SalaryAdvanceDto;
import com.knoweb.HRM.service.SalaryAdvanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/v1/hr/advances")
public class SalaryAdvanceController {

    @Autowired
    private SalaryAdvanceService salaryAdvanceService;

    @PostMapping
    public ResponseEntity<SalaryAdvanceDto> submitRequest(@RequestBody SalaryAdvanceDto requestDto) {
        return ResponseEntity.ok(salaryAdvanceService.createRequest(requestDto));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<SalaryAdvanceDto>> getEmployeeAdvaces(@PathVariable String employeeId) {
        return ResponseEntity.ok(salaryAdvanceService.getByEmployeeId(employeeId));
    }

    @GetMapping
    public ResponseEntity<List<SalaryAdvanceDto>> getAdvancesByStatus(
            @RequestParam(required = false, defaultValue = "PENDING") String status) {
        return ResponseEntity.ok(salaryAdvanceService.getByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SalaryAdvanceDto> processAdvance(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam String approvedBy) {
        return ResponseEntity.ok(salaryAdvanceService.updateStatus(id, status, approvedBy));
    }
}