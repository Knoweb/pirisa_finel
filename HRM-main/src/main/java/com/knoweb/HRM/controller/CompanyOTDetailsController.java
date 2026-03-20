package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Attendance;
import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.CompanyOTDetails;
import com.knoweb.HRM.service.CompanyOTDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companyOT")
public class CompanyOTDetailsController {

    @Autowired
    private CompanyOTDetailsService companyOTDetailsService;

    @PostMapping(value = "/add_OTDetails", produces = {"application/json"})
    public ResponseEntity<?> addOTDetails(@RequestBody CompanyOTDetails companyOTDetails) {
        try {
            CompanyOTDetails createdCompanyDetails = companyOTDetailsService.createCompanyDetails(companyOTDetails);
            if (createdCompanyDetails != null) {
                Map<String, Object> companyResponse = new HashMap<>();
                companyResponse.put("resultCode", 100);
                companyResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Company", createdCompanyDetails);
                responseBody.put("response", companyResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PutMapping(value = "/{cmp_id}", produces = {"application/json"})
    public ResponseEntity<?> updateCompanyOTDetails(@PathVariable Long cmp_id, @RequestBody CompanyOTDetails updateCompanyOTDetails) {

        CompanyOTDetails companyOTDetails = companyOTDetailsService.updateCompanyOTDetails(cmp_id, updateCompanyOTDetails);
        if (companyOTDetails != null) {
            Map<String, Object> companyResponse = new HashMap<>();
            companyResponse.put("resultCode", 100);
            companyResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Company", companyOTDetails);
            responseBody.put("response", companyResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);

        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping(value = "/{cmp_Id}", produces = "application/json")
    public ResponseEntity<?> getOTDetailsByCompanyId(@PathVariable long cmp_Id) {
        try {
            CompanyOTDetails companyOTDetails = companyOTDetailsService.getCompanyOTDetailsByCompanyId(cmp_Id);
            if (companyOTDetails == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No OT Details found for this Company ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("OT Details", companyOTDetails);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching OT Details"));
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
