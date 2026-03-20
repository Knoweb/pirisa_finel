package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.dto.PayroleEmployeeDTO;
import com.knoweb.HRM.model.Payrole;
import com.knoweb.HRM.service.PayroleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payrole")
public class PayroleController {

    @Autowired
    private PayroleService payroleService;


    @PostMapping(value = "/add_payrole", produces = {"application/json"})
    public ResponseEntity<?> addPayrole(@RequestBody Payrole payrole) {
        try {
            Payrole createdPayrole = payroleService.createPayrole(payrole);
            if (createdPayrole != null) {
                Map<String, Object> payroleResponse = new HashMap<>();
                payroleResponse.put("resultCode", 100);
                payroleResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Employee", createdPayrole);
                responseBody.put("response", payroleResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @DeleteMapping("/{payrole_id}")
    public ResponseEntity<?> deletePayrole(@PathVariable Long payrole_id) {
        try {
            payroleService.deletePayrole(payrole_id);

            Map<String, Object> payroleResponse = new HashMap<>();
            payroleResponse.put("resultCode", 100);
            payroleResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", payrole_id);
            responseBody.put("response", payroleResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }


    @GetMapping(value = "/payroleListEmp/{empId}", produces = "application/json")
    public ResponseEntity<?> getPayroleByEmployeeId(@PathVariable long empId) {
        try {
            List<Payrole> payrole = payroleService.getPayroleByEmployeeId(empId);
            if (payrole.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No Payrole List found for this employee ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", payrole);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
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
