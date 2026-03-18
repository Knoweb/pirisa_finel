package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Allowance;
import com.knoweb.HRM.service.AllowanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/allowance")
public class AllowanceController {

    @Autowired
    private AllowanceService allowanceService;


    @PostMapping(value = "/add_allowance", produces = {"application/json"})
    public ResponseEntity<?> addAllowance(@RequestBody Allowance allowance) {
        try {
            Allowance createdAllowance = allowanceService.createAllowance(allowance);
            if (createdAllowance != null) {
                Map<String, Object> allowanceResponse = new HashMap<>();
                allowanceResponse.put("resultCode", 100);
                allowanceResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Add_Allowance", createdAllowance);
                responseBody.put("response", allowanceResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping(value = "/company/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getAllowanceByCompanyId(@PathVariable long cmpId) {
        try {
            List<Allowance> allowances = allowanceService.getAllowanceByCompanyId(cmpId);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("AllowanceList", allowances);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching Allowance"));
        }
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<?> getAllowanceById(@PathVariable Long id) {
        try {
            return allowanceService.getAllowanceById(id)
                    .map(allowance -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("resultCode", 100);
                        response.put("resultDesc", "Successful");
                        response.put("allowance", allowance);
                        return ResponseEntity.ok(response);
                    })
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Collections.singletonMap("message", "Allowance not found")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching allowance"));
        }
    }

    @PutMapping(value = "/update_allowance", produces = {"application/json"})
    public ResponseEntity<?> updateAllowance(@RequestBody Allowance allowance) {
        try {
            if (!allowanceService.getAllowanceById(allowance.getId()).isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 101);
                errorResponse.put("resultDesc", "Allowance not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            Allowance updatedAllowance = allowanceService.updateAllowance(allowance);
            Map<String, Object> allowanceResponse = new HashMap<>();
            allowanceResponse.put("resultCode", 100);
            allowanceResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Update_Allowance", updatedAllowance);
            responseBody.put("response", allowanceResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @DeleteMapping(value = "/{id}", produces = {"application/json"})
    public ResponseEntity<?> deleteAllowance(@PathVariable Long id) {
        try {
            allowanceService.deleteAllowance(id);

            Map<String, Object> allowanceResponse = new HashMap<>();
            allowanceResponse.put("resultCode", 100);
            allowanceResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", id);
            responseBody.put("response", allowanceResponse);

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
