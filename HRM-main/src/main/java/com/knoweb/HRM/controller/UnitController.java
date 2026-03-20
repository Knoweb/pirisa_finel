package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Unit;
import com.knoweb.HRM.service.UnitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/department")
public class UnitController {

    @Autowired
    private UnitService unitService;


    @PostMapping(value = "/add_department", produces = {"application/json"})
    public ResponseEntity<?> addUnit(@RequestBody Unit unit) {
        try {
            // Check for duplicate unit code or name within the same company
            List<Unit> existingDepts = unitService.getUnitsByCompanyId(unit.getCmpId());
            boolean duplicate = existingDepts.stream().anyMatch(dept -> 
                dept.getDptCode().equals(unit.getDptCode()) || 
                dept.getDptName().equalsIgnoreCase(unit.getDptName())
            );
            
            if (duplicate) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 102);
                errorResponse.put("resultDesc", "Unit code or name already exists");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
            
            Unit createdUnit = unitService.createUnit(unit);
            if (createdUnit != null) {
                Map<String, Object> unitResponse = new HashMap<>();
                unitResponse.put("resultCode", 100);
                unitResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Add_Att", createdUnit);
                responseBody.put("response", unitResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping(value = "/company/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getUnitsByCompanyId(@PathVariable long cmpId) {
        try {
            List<Unit> units = unitService.getUnitsByCompanyId(cmpId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("UnitList", units);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching units"));
        }
    }

    @GetMapping(value = "/search/{cmpId}", produces = "application/json")
    public ResponseEntity<?> searchUnits(@PathVariable long cmpId, @RequestParam String query) {
        try {
            List<Unit> units = unitService.searchUnits(cmpId, query);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("UnitList", units);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while searching units"));
        }
    }

    @PutMapping(value = "/update_department", produces = {"application/json"})
    public ResponseEntity<?> updateUnit(@RequestBody Unit unit) {
        try {
            // Check for duplicate unit code or name (excluding current unit)
            List<Unit> existingDepts = unitService.getUnitsByCompanyId(unit.getCmpId());
            boolean duplicate = existingDepts.stream().anyMatch(dept -> 
                dept.getId() != unit.getId() && (
                    dept.getDptCode().equals(unit.getDptCode()) || 
                    dept.getDptName().equalsIgnoreCase(unit.getDptName())
                )
            );
            
            if (duplicate) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 102);
                errorResponse.put("resultDesc", "Unit code or name already exists");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
            
            Unit updatedUnit = unitService.updateUnit(unit);
            if (updatedUnit != null) {
                Map<String, Object> unitResponse = new HashMap<>();
                unitResponse.put("resultCode", 100);
                unitResponse.put("resultDesc", "Successfully Updated");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Unit", updatedUnit);
                responseBody.put("response", unitResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }


    @DeleteMapping("/{dpt_id}")
    public ResponseEntity<?> deleteUnit(@PathVariable Long dpt_id) {
        try {
            unitService.deleteUnit(dpt_id);

            Map<String, Object> unitResponse = new HashMap<>();
            unitResponse.put("resultCode", 100);
            unitResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", dpt_id);
            responseBody.put("response", unitResponse);

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
