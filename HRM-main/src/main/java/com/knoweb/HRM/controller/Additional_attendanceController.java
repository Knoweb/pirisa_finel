package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Additional_attendance;
import com.knoweb.HRM.service.Additional_attendanceServise;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/additional_attendance")
public class Additional_attendanceController {

    @Autowired
    private Additional_attendanceServise additional_attendanceServise;


    @PostMapping(value = "/add_attendance", produces = {"application/json"})
    public ResponseEntity<?> addAdditional_Attendance(@RequestBody Additional_attendance additional_attendance) {
        try {
            Additional_attendance additionalAttendance = additional_attendanceServise.createAdditional_Attendance(additional_attendance);
            if (additionalAttendance != null) {
                Map<String, Object> Ad_AttendanceResponse = new HashMap<>();
                Ad_AttendanceResponse.put("resultCode", 100);
                Ad_AttendanceResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Add_Att", additionalAttendance);
                responseBody.put("response", Ad_AttendanceResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @DeleteMapping("/{additional_atdnc_id}")
    public ResponseEntity<?> deleteAdditionalAttendance(@PathVariable Long additional_atdnc_id) {
        try {
            additional_attendanceServise.deleteAddi_Attendance(additional_atdnc_id);

            Map<String, Object> additional_AttendanceResponse = new HashMap<>();
            additional_AttendanceResponse.put("resultCode", 100);
            additional_AttendanceResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", additional_atdnc_id);
            responseBody.put("response", additional_AttendanceResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PutMapping(value = "/{additional_atdnc_id}", produces = {"application/json"})
    public ResponseEntity<?> updateAdditional_Attendance(@PathVariable Long additional_atdnc_id, @RequestBody Additional_attendance additional_attendance) {

        Additional_attendance additionalattendance = additional_attendanceServise.updateAdditional_Attendance(additional_atdnc_id, additional_attendance);
        if (additionalattendance != null) {
            Map<String, Object> AdditionalAttendanceResponse = new HashMap<>();
            AdditionalAttendanceResponse.put("resultCode", 100);
            AdditionalAttendanceResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Addi_Attendance", additionalattendance);
            responseBody.put("response", AdditionalAttendanceResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);

        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
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
