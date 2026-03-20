package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Bonus;
import com.knoweb.HRM.service.BonusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bonus")
public class BonusController {

    @Autowired
    private BonusService bonusService;


    @PostMapping(value = "/add_bonus", produces = {"application/json"})
    public ResponseEntity<?> addBonus(@RequestBody Bonus bonus) {
        try {
            Bonus createdBonus = bonusService.createBonus(bonus);
            if (createdBonus != null) {
                Map<String, Object> bonusResponse = new HashMap<>();
                bonusResponse.put("resultCode", 100);
                bonusResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Added_Bonus", createdBonus);
                responseBody.put("response", bonusResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping(value = "/company/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getBonusByCompanyId(@PathVariable long cmpId) {
        try {
            List<Bonus> bonuses = bonusService.getBonusByCompanyId(cmpId);
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("BonusList", bonuses);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching Allowance"));
        }
    }

    @PutMapping(value = "/update/{id}", produces = {"application/json"})
    public ResponseEntity<?> updateBonus(@PathVariable Long id, @RequestBody Bonus bonus) {
        try {
            // Set the ID from path variable
            bonus.setId(id);
            
            Bonus updatedBonus = bonusService.updateBonus(bonus);
            if (updatedBonus != null) {
                Map<String, Object> bonusResponse = new HashMap<>();
                bonusResponse.put("resultCode", 100);
                bonusResponse.put("resultDesc", "Successfully Updated");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Updated_Bonus", updatedBonus);
                responseBody.put("response", bonusResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @DeleteMapping(value = "/delete/{id}", produces = {"application/json"})
    public ResponseEntity<?> deleteBonus(@PathVariable Long id) {
        try {
            boolean deleted = bonusService.deleteBonus(id);
            if (deleted) {
                Map<String, Object> bonusResponse = new HashMap<>();
                bonusResponse.put("resultCode", 100);
                bonusResponse.put("resultDesc", "Successfully Deleted");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("id", id);
                responseBody.put("response", bonusResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
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
