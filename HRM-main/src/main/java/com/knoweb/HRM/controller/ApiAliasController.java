package com.knoweb.HRM.controller;

import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.service.CalendarEventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/"))
@CrossOrigin(origins = "http://localhost:5174")
public class ApiAliasController {

    private static final Logger logger = LoggerFactory.getLogger(ApiAliasController.class);

    @Autowired
    private CalendarEventService calendarEventService;

    // Alias endpoint matching frontend expectation: /api/employees/search?companyId=...&query=...
    @GetMapping("/employees/search")
    public ResponseEntity<?> searchEmployeesAlias(@RequestParam Long companyId, @RequestParam String query) {
        try {
            if (query == null || query.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 101);
                errorResponse.put("resultDesc", "Search query is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            List<Employee> employees = calendarEventService.searchEmployees(companyId, query.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Employees searched successfully");
            response.put("employees", employees);
            response.put("count", employees.size());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error searching employees for company {}: {}", companyId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error searching employees: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
