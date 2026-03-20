package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.EmployeeLeave;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.service.EmailService;
import com.knoweb.HRM.service.EmployeeLeaveRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emp_leave")
public class EmployeeLeaveRequestController {


    @Autowired
    private EmployeeLeaveRequestService employeeLeaveRequestService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmployeeRepository employeeRepository;


    @PostMapping(value = "/add_leave", produces = {"application/json"})
    public ResponseEntity<?> addLeave(@RequestBody EmployeeLeave employeeLeave) {
        try {
            EmployeeLeave createdEmployeeLeave = employeeLeaveRequestService.createEmployeeLeave(employeeLeave);
            if (createdEmployeeLeave != null) {
                Map<String, Object> leaveResponse = new HashMap<>();
                leaveResponse.put("resultCode", 100);
                leaveResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Add_EmployeeLeave", createdEmployeeLeave);
                responseBody.put("response", leaveResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }


    @PutMapping(value = "/{empleave_id}", produces = {"application/json"})
    public ResponseEntity<?> updateEmployeeLeave(@PathVariable Long empleave_id, @RequestBody EmployeeLeave updateEmployeeLeave) {

        EmployeeLeave employeeLeave = employeeLeaveRequestService.updateEmployeeLeave(empleave_id, updateEmployeeLeave);
        EmployeeLeave email = employeeLeaveRequestService.getEmployeeLeaveById(empleave_id);
        if (employeeLeave != null) {
            Map<String, Object> employeeResponse = new HashMap<>();
            employeeResponse.put("resultCode", 100);
            employeeResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Employee Leave", employeeLeave);
            responseBody.put("response", employeeResponse);

            Employee employee = employeeRepository.findById(email.getEmpId()).orElse(null);
            if (employee.getEmail() != null) {


                String subject = "Leave Request Approval!";
                String content = "<p>Your Leave Request on "
                        + email.getLeaveStartDay()
                        + " to "
                        + email.getLeaveEndDay()
                        + " has been <strong>"
                        + updateEmployeeLeave.getLeaveStatus()
                        + "</strong></p>"
                        + "<p>Please contact HRM Division if you need any further details.</p>";;


                emailService.sendEmail(employee.getEmail(), subject, content);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "There is no Email to this employee"));
            }
            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }


    @GetMapping(value = "/employees-on-leave-today", produces = {"application/json"})
    public ResponseEntity<?> getEmployeesOnLeaveToday() {
        try {
            LocalDateTime today = LocalDateTime.now();
            List<EmployeeLeave> employeesOnLeave = employeeLeaveRequestService.getEmployeesOnLeaveForDate(today);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successfully retrieved employees on leave");
            response.put("employeesOnLeave", employeesOnLeave);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }


    @PostMapping(value = "/cancel-leave-and-mark-attendance", produces = {"application/json"})
    public ResponseEntity<?> cancelLeaveAndMarkAttendance(@RequestBody Map<String, Object> request) {
        try {
            Long empId = Long.valueOf(request.get("empId").toString());
            String cancellationReason = request.get("cancellationReason") != null ? request.get("cancellationReason").toString() : "Employee came to office";
            String canceledBy = request.get("canceledBy") != null ? request.get("canceledBy").toString() : "HR Admin";
            
            EmployeeLeave cancelledLeave = employeeLeaveRequestService.cancelLeaveAndMarkAttendance(empId, cancellationReason, canceledBy);
            
            if (cancelledLeave != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("resultCode", 100);
                response.put("resultDesc", "Leave cancelled successfully and employee is available for attendance");
                response.put("cancelledLeave", cancelledLeave);
                
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("resultCode", 101);
                response.put("resultDesc", "No active leave found for this employee");
                
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
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
}
