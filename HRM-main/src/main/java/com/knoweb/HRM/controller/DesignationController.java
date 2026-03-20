package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Designation;
import com.knoweb.HRM.service.DesignationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/designation")
public class DesignationController {

    @Autowired
    private DesignationService designationService;


    @PostMapping(value = "/add_designation", produces = {"application/json"})
    public ResponseEntity<?> addDesignation(@RequestBody Designation designation) {
        try {
            Designation createdDesignation = designationService.createDesignation(designation);
            if (createdDesignation != null) {
                Map<String, Object> designationResponse = new HashMap<>();
                designationResponse.put("resultCode", 100);
                designationResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Designation", createdDesignation);
                responseBody.put("response", designationResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @DeleteMapping("/{designation_id}")
    public ResponseEntity<?> deleteDesignation(@PathVariable Long designation_id) {
        try {
            designationService.deleteDesignation(designation_id);

            Map<String, Object> designationResponse = new HashMap<>();
            designationResponse.put("resultCode", 100);
            designationResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", designation_id);
            responseBody.put("response", designationResponse);

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
