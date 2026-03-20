package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Allowance;
import com.knoweb.HRM.model.CompanyLeave;
import com.knoweb.HRM.model.Unit;
import com.knoweb.HRM.service.AllowanceService;
import com.knoweb.HRM.service.CompanyLeaveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/company_leave")
public class CompanyLeaveController {

    @Autowired
    private CompanyLeaveService companyLeaveService;


    @PostMapping(value = "/add_leave", produces = {"application/json"})
    public ResponseEntity<?> addLeave(@RequestBody CompanyLeave companyLeave) {
        try {
            CompanyLeave createdCompanyLeave = companyLeaveService.createCompanyLeave(companyLeave);
            if (createdCompanyLeave != null) {
                Map<String, Object> leaveResponse = new HashMap<>();
                leaveResponse.put("resultCode", 100);
                leaveResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Add_CompanyLeave", createdCompanyLeave);
                responseBody.put("response", leaveResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping(value = "/company/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getLeaveByCompanyId(@PathVariable long cmpId) {
        try {
            List<CompanyLeave> companyLeaves = companyLeaveService.getLeaveByCompanyId(cmpId);
            if (companyLeaves.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No Leave found for this company ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("LeavetList", companyLeaves);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching Leaves"));
        }
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<?> getLeaveById(@PathVariable Long id) {
        try {
            return companyLeaveService.getLeaveById(id)
                    .map(leave -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("resultCode", 100);
                        response.put("resultDesc", "Successful");
                        response.put("leave", leave);
                        return ResponseEntity.ok(response);
                    })
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Collections.singletonMap("message", "Leave not found")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching leave"));
        }
    }

    @PutMapping(value = "/update_leave", produces = {"application/json"})
    public ResponseEntity<?> updateLeave(@RequestBody CompanyLeave companyLeave) {
        try {
            if (!companyLeaveService.getLeaveById(companyLeave.getId()).isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 101);
                errorResponse.put("resultDesc", "Leave not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            CompanyLeave updatedLeave = companyLeaveService.updateLeave(companyLeave);
            Map<String, Object> leaveResponse = new HashMap<>();
            leaveResponse.put("resultCode", 100);
            leaveResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Update_Leave", updatedLeave);
            responseBody.put("response", leaveResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @DeleteMapping(value = "/{id}", produces = {"application/json"})
    public ResponseEntity<?> deleteLeave(@PathVariable Long id) {
        try {
            companyLeaveService.deleteLeave(id);

            Map<String, Object> leaveResponse = new HashMap<>();
            leaveResponse.put("resultCode", 100);
            leaveResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", id);
            responseBody.put("response", leaveResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 101);
            errorResponse.put("resultDesc", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
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
