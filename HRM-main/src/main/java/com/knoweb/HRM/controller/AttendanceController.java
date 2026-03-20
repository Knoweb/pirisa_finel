package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.model.Attendance;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping(value = "/add_attendance", produces = { "application/json" })
    public ResponseEntity<?> addAttendance(@RequestBody Attendance attendance) {
        try {
            Attendance createdAttendance = attendanceService.createAttendance(attendance);
            if (createdAttendance != null) {
                Map<String, Object> attendanceResponse = new HashMap<>();
                attendanceResponse.put("resultCode", 100);
                attendanceResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Add_Att", createdAttendance);
                responseBody.put("response", attendanceResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping(value = "/employee/{empId}", produces = "application/json")
    public ResponseEntity<?> getAttendanceByEmployeeId(@PathVariable long empId) {
        try {
            List<Attendance> attendances = attendanceService.getAttendanceByEmployeeId(empId);
            if (attendances.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No attendance found for this employee ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("AttendanceList", attendances);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }

    // get attendance by employee id and month

    @GetMapping(value = "/employee/{empId}/month/{month}", produces = "application/json")
    public ResponseEntity<?> getAttendanceByEmployeeAndMonth(
            @PathVariable long empId,
            @PathVariable int month) {
        List<Attendance> list = attendanceService.getAttendanceByEmployeeIdAndMonth(empId, month);

        if (list.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap(
                            "message",
                            "No attendance found for employee " + empId + " in month " + month));
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("resultCode", 100);
        resp.put("resultDesc", "Successful");
        resp.put("AttendanceList", list);
        return ResponseEntity.ok(resp);
    }

    //
    // @GetMapping(value = "/company/{cmpId}", produces = "application/json")
    // public ResponseEntity<?> getAttendanceByCompanyId(@PathVariable long cmpId) {
    // try {
    // List<Attendance> attendances =
    // attendanceService.getAttendanceByCompanyId(cmpId);
    // if (attendances.isEmpty()) {
    // return ResponseEntity.status(HttpStatus.NOT_FOUND)
    // .body(Collections.singletonMap("message", "No attendance found for this
    // Company ID"));
    // }
    //
    // Map<String, Object> response = new HashMap<>();
    // response.put("resultCode", 100);
    // response.put("resultDesc", "Successful");
    // response.put("AttendanceList", attendances);
    //
    // return ResponseEntity.ok(response);
    // } catch (Exception e) {
    // return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
    // .body(Collections.singletonMap("error", "An error occurred while fetching
    // employees"));
    // }
    // }

    @DeleteMapping("/{atdnc_id}")
    public ResponseEntity<?> deleteAttendance(@PathVariable Long atdnc_id) {
        try {
            attendanceService.deleteAttendance(atdnc_id);

            Map<String, Object> attendanceResponse = new HashMap<>();
            attendanceResponse.put("resultCode", 100);
            attendanceResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", atdnc_id);
            responseBody.put("response", attendanceResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PutMapping(value = "/update/{atdnc_id}", produces = { "application/json" })
    public ResponseEntity<?> updateAttendance(@PathVariable Long atdnc_id, @RequestBody Attendance updateAttendance) {

        Attendance attendance = attendanceService.updateAttendance(atdnc_id, updateAttendance);
        if (attendance != null) {
            Map<String, Object> attendanceResponse = new HashMap<>();
            attendanceResponse.put("resultCode", 100);
            attendanceResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Attendance", attendance);
            responseBody.put("response", attendanceResponse);

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
