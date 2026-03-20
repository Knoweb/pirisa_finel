package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.dto.LeaveBalanceResponseDTO;
import com.knoweb.HRM.service.LeaveBalanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/leave_balance")
public class LeaveBalanceController {

    @Autowired
    private LeaveBalanceService leaveBalanceService;

    @GetMapping(value = "/employee/{empId}", produces = "application/json")
    public ResponseEntity<?> getEmployeeLeaveBalances(
            @PathVariable long empId,
            @RequestParam(name = "asOfMode", defaultValue = "CURRENT_DATE") String asOfMode) {
        try {
            LeaveBalanceService.AsOfMode mode;
            try {
                mode = LeaveBalanceService.AsOfMode.valueOf(asOfMode);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(errorBody("Invalid asOfMode"));
            }

            LeaveBalanceResponseDTO response = leaveBalanceService.getEmployeeLeaveBalances(empId, mode);
            if (response.getResultCode() != 100) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("An error occurred while fetching leave balances"));
        }
    }

    @PostMapping(value = "/run_calculation/{cmpId}", produces = "application/json")
    public ResponseEntity<?> runCompanyCalculation(
            @PathVariable long cmpId,
            @RequestParam(name = "calculationDate", required = false) String calculationDate) {
        try {
            LocalDate date = null;
            if (calculationDate != null && !calculationDate.trim().isEmpty()) {
                date = LocalDate.parse(calculationDate);
            }
            LeaveBalanceResponseDTO response = leaveBalanceService.runCompanyLeaveCalculation(cmpId, date);
            if (response.getResultCode() != 100) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("An error occurred while running leave calculation"));
        }
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("resultCode", 101);
        errorResponse.put("resultDesc", "ERROR");

        String jsonResponse;
        try {
            jsonResponse = new ObjectMapper().writeValueAsString(errorResponse);
        } catch (Exception ex) {
            jsonResponse = "{\"resultCode\":101,\"resultDesc\":\"ERROR\"}";
        }
        return new ResponseEntity<>(jsonResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private Map<String, Object> errorBody(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("resultCode", 101);
        body.put("resultDesc", message);
        return body;
    }
}
