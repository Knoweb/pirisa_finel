package com.knoweb.HRM.controller;

import com.knoweb.HRM.model.CalendarEvent;
import com.knoweb.HRM.model.Unit;
import com.knoweb.HRM.model.Designation;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.service.CalendarEventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Objects;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "http://localhost:5174")
public class CalendarEventController {

    private static final Logger logger = LoggerFactory.getLogger(CalendarEventController.class);

    @Autowired
    private CalendarEventService calendarEventService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Create new event with enhanced features
    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> eventData) {
        try {
            // Validate required fields
            if (!eventData.containsKey("title") || eventData.get("title") == null || 
                ((String) eventData.get("title")).trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 101);
                errorResponse.put("resultDesc", "Event title is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
            
            if (!eventData.containsKey("startDate") || eventData.get("startDate") == null || 
                ((String) eventData.get("startDate")).trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 102);
                errorResponse.put("resultDesc", "Start date is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
            
            // Extract event data
            CalendarEvent event = new CalendarEvent();
            event.setTitle(((String) eventData.get("title")).trim());
            event.setDescription((String) eventData.get("description"));
            
            // Handle event type
            String eventType = (String) eventData.get("eventType");
            String customEventType = (String) eventData.get("customEventType");
            if ("CUSTOM".equals(eventType) && customEventType != null && !customEventType.trim().isEmpty()) {
                event.setEventType(customEventType.trim());
            } else {
                event.setEventType(eventType);
            }
            
            // Handle date conversion with proper error handling
            try {
                String startDateStr = (String) eventData.get("startDate");
                event.setStartDate(LocalDateTime.parse(startDateStr));
                
                // Handle end date - only if provided and not optional
                Boolean isEndDateOptional = (Boolean) eventData.getOrDefault("isEndDateOptional", true);
                event.setIsEndDateOptional(isEndDateOptional);
                
                if (!isEndDateOptional && eventData.containsKey("endDate") && 
                    eventData.get("endDate") != null && !((String) eventData.get("endDate")).trim().isEmpty()) {
                    String endDateStr = (String) eventData.get("endDate");
                    LocalDateTime endDate = LocalDateTime.parse(endDateStr);
                    
                    // Validate that end date is not before start date
                    if (endDate.isBefore(event.getStartDate())) {
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("resultCode", 104);
                        errorResponse.put("resultDesc", "End date cannot be before start date");
                        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
                    }
                    
                    event.setEndDate(endDate);
                }
                
                // Handle time settings
                Boolean hasTime = (Boolean) eventData.getOrDefault("hasTime", false);
                Boolean hasEndTime = (Boolean) eventData.getOrDefault("hasEndTime", false);
                event.setHasTime(hasTime);
                event.setHasEndTime(hasEndTime);
                
                // Set allDay based on hasTime
                event.setAllDay(!hasTime);
                
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 103);
                errorResponse.put("resultDesc", "Invalid date format. Please use ISO date format");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
            
            event.setColor((String) eventData.get("color"));
            event.setLocation((String) eventData.get("location"));
            event.setCompanyId(((Number) eventData.get("companyId")).longValue());
            event.setCreatedBy(eventData.get("createdBy") != null ? ((Number) eventData.get("createdBy")).longValue() : null);
            event.setStatus((String) eventData.getOrDefault("status", "PENDING"));
            event.setCompletionPercentage((Integer) eventData.getOrDefault("completionPercentage", 0));
            event.setVisibility((String) eventData.getOrDefault("visibility", "COMPANY_ONLY"));
            
            // Handle advanced visibility settings
            if (eventData.containsKey("selectedDepartments")) {
                Object selectedDepts = eventData.get("selectedDepartments");
                if (selectedDepts instanceof List) {
                    event.setSelectedDepartments(convertListToJson((List<?>) selectedDepts));
                } else if (selectedDepts instanceof String) {
                    // Handle string arrays like "[1,2,3]"
                    event.setSelectedDepartments((String) selectedDepts);
                }
            }
            
            if (eventData.containsKey("selectedSubDepartments")) {
                Object selectedSubDepts = eventData.get("selectedSubDepartments");
                if (selectedSubDepts instanceof List) {
                    event.setSelectedSubDepartments(convertListToJson((List<?>) selectedSubDepts));
                } else if (selectedSubDepts instanceof String) {
                    // Handle string arrays like "[1,2,3]"
                    event.setSelectedSubDepartments((String) selectedSubDepts);
                }
            }
            
            event.setIncludeAllSubDepartments((Boolean) eventData.getOrDefault("includeAllSubDepartments", false));
            
            // Handle employee assignments
            if (eventData.containsKey("employeeIds")) {
                Object empIds = eventData.get("employeeIds");
                if (empIds instanceof List) {
                    event.setEmployeeIds(convertListToJson((List<?>) empIds));
                } else if (empIds instanceof String) {
                    // Handle string arrays like "[1,2,3]"
                    event.setEmployeeIds((String) empIds);
                }
            }
            
            // Handle department and designation fields (for backward compatibility)
            if (eventData.containsKey("departmentId")) {
                Object deptId = eventData.get("departmentId");
                event.setUnitId(deptId != null ? ((Number) deptId).longValue() : null);
            }
            
            if (eventData.containsKey("designationIds")) {
                Object desigIds = eventData.get("designationIds");
                event.setDesignationIds(desigIds != null ? desigIds.toString() : null);
            }
            
            // Save the event
            CalendarEvent createdEvent = calendarEventService.createEvent(event);
            
            // Handle visibility-based employee assignments
            String visibility = createdEvent.getVisibility();
            if ("DEPARTMENT".equals(visibility) && createdEvent.getUnitId() != null) {
                calendarEventService.assignEmployeesInUnit(createdEvent.getId(), createdEvent.getUnitId());
            } else if ("DESIGNATION".equals(visibility) && createdEvent.getDesignationIds() != null) {
                calendarEventService.assignEmployeesByDesignations(createdEvent.getId(), createdEvent.getDesignationIds());
            } else if ("SELECTED_EMPLOYEES".equals(visibility) && createdEvent.getEmployeeIds() != null) {
                calendarEventService.assignEmployeesByIds(createdEvent.getId(), createdEvent.getEmployeeIds());
            }
            
            // Send email notifications to affected employees
            try {
                calendarEventService.sendEventNotifications(createdEvent);
            } catch (Exception e) {
                logger.warn("Failed to send email notifications for event {}: {}", createdEvent.getId(), e.getMessage());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Event created successfully");
            response.put("event", createdEvent);
            
            logger.info("Event created successfully: {} by user {}", createdEvent.getId(), createdEvent.getCreatedBy());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
            
        } catch (Exception e) {
            logger.error("Error creating event: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Failed to create event: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // Helper method to convert list to JSON string
    private String convertListToJson(List<?> list) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(list);
        } catch (Exception e) {
            logger.error("Error converting list to JSON: {}", e.getMessage());
            return "[]";
        }
    }
    
    // Employee search endpoint for event creation
    @GetMapping("/employees/search")
    public ResponseEntity<?> searchEmployees(
            @RequestParam String query,
            @RequestParam Long companyId) {
        try {
            logger.info("Searching employees with query '{}' for company ID: {}", query, companyId);
            
            List<Employee> employees = calendarEventService.searchEmployees(query, companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Employees retrieved successfully");
            response.put("employees", employees);
            response.put("count", employees.size());
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error searching employees: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error searching employees: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all events for a company
    @GetMapping("/events/company/{companyId}")
    public ResponseEntity<?> getEventsByCompany(@PathVariable Long companyId) {
        try {
            List<CalendarEvent> events = calendarEventService.getAllEventsByCompanyId(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Events retrieved successfully");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get events by date range
    @GetMapping("/events/company/{companyId}/range")
    public ResponseEntity<?> getEventsByDateRange(
            @PathVariable Long companyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<CalendarEvent> events = calendarEventService.getEventsByDateRange(companyId, startDate, endDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Events retrieved successfully");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get events by month
    @GetMapping("/events/company/{companyId}/month/{year}/{month}")
    public ResponseEntity<?> getEventsByMonth(
            @PathVariable Long companyId,
            @PathVariable int year,
            @PathVariable int month) {
        try {
            List<CalendarEvent> events = calendarEventService.getEventsByMonth(companyId, year, month);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Events retrieved successfully");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get today's events
    @GetMapping("/events/company/{companyId}/today")
    public ResponseEntity<?> getTodayEvents(@PathVariable Long companyId) {
        try {
            List<CalendarEvent> events = calendarEventService.getTodayEvents(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Today's events retrieved successfully");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving today's events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get upcoming events
    @GetMapping("/events/company/{companyId}/upcoming")
    public ResponseEntity<?> getUpcomingEvents(@PathVariable Long companyId) {
        try {
            List<CalendarEvent> events = calendarEventService.getUpcomingEvents(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Upcoming events retrieved successfully");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving upcoming events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get event by ID
    @GetMapping("/events/{eventId}")
    public ResponseEntity<?> getEventById(@PathVariable Long eventId) {
        try {
            CalendarEvent event = calendarEventService.getEventById(eventId);
            if (event == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 404);
                errorResponse.put("resultDesc", "Event not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Event retrieved successfully");
            response.put("event", event);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving event: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Update event
    @PutMapping("/events/{eventId}")
    public ResponseEntity<?> updateEvent(@PathVariable Long eventId, @RequestBody Map<String, Object> eventData) {
        try {
            // Check for time conflicts
            CalendarEvent existingEvent = calendarEventService.getEventById(eventId);
            if (existingEvent == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 404);
                errorResponse.put("resultDesc", "Event not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            // Create updated event object
            CalendarEvent updatedEvent = new CalendarEvent();
            updatedEvent.setTitle((String) eventData.get("title"));
            updatedEvent.setDescription((String) eventData.get("description"));
            
            // Handle date conversion with proper error handling
            try {
                if (eventData.get("startDate") != null && eventData.get("startDate") instanceof String) {
                    String startDateStr = (String) eventData.get("startDate");
                    if (!startDateStr.isEmpty()) {
                        updatedEvent.setStartDate(LocalDateTime.parse(startDateStr));
                    }
                }
                if (eventData.get("endDate") != null && eventData.get("endDate") instanceof String) {
                    String endDateStr = (String) eventData.get("endDate");
                    if (!endDateStr.isEmpty()) {
                        updatedEvent.setEndDate(LocalDateTime.parse(endDateStr));
                    }
                }
            } catch (Exception e) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 103);
                errorResponse.put("resultDesc", "Invalid date format. Please use ISO date format");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
            
            updatedEvent.setEventType((String) eventData.get("eventType"));
            updatedEvent.setColor((String) eventData.get("color"));
            updatedEvent.setAllDay((Boolean) eventData.getOrDefault("allDay", false));
            updatedEvent.setLocation((String) eventData.get("location"));
            updatedEvent.setStatus((String) eventData.get("status"));
            updatedEvent.setCompletionPercentage((Integer) eventData.get("completionPercentage"));
            updatedEvent.setHasTime((Boolean) eventData.getOrDefault("hasTime", true));
            updatedEvent.setIsEndDateOptional((Boolean) eventData.getOrDefault("isEndDateOptional", false));
            updatedEvent.setVisibility((String) eventData.get("visibility"));
            
            // Handle department and designation fields
            if (eventData.containsKey("departmentId")) {
                Object deptId = eventData.get("departmentId");
                updatedEvent.setUnitId(deptId != null ? ((Number) deptId).longValue() : null);
            }
            
            if (eventData.containsKey("designationIds")) {
                Object desigIds = eventData.get("designationIds");
                updatedEvent.setDesignationIds(desigIds != null ? desigIds.toString() : null);
            }

            if (calendarEventService.hasTimeConflict(existingEvent.getCompanyId(), 
                    updatedEvent.getStartDate(), updatedEvent.getEndDate(), eventId)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 102);
                errorResponse.put("resultDesc", "Event time conflicts with existing event");
                return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
            }

            // Handle employee assignments for department/designation visibility
            if (updatedEvent.getVisibility() != null) {
                String visibility = updatedEvent.getVisibility();
                
                if ("DEPARTMENT".equals(visibility) && updatedEvent.getUnitId() != null) {
                    // Assign all employees in the selected department
                    calendarEventService.assignEmployeesInUnit(eventId, updatedEvent.getUnitId());
                } else if ("DESIGNATION".equals(visibility) && updatedEvent.getDesignationIds() != null) {
                    // Assign all employees with the selected designations
                    calendarEventService.assignEmployeesByDesignations(eventId, updatedEvent.getDesignationIds());
                } else if ("SELECTED_EMPLOYEES".equals(visibility) && eventData.containsKey("employeeIds")) {
                    // Handle specific employee assignments
                    Object empIds = eventData.get("employeeIds");
                    if (empIds instanceof List) {
                        List<Long> employeeIds = ((List<?>) empIds).stream()
                            .map(id -> ((Number) id).longValue())
                            .collect(java.util.stream.Collectors.toList());
                        calendarEventService.assignSelectedEmployees(eventId, employeeIds);
                    }
                } else {
                    // Clear existing assignments for other visibility types
                    calendarEventService.clearEmployeeAssignments(eventId);
                }
            }

            CalendarEvent event = calendarEventService.updateEvent(eventId, updatedEvent);
            if (event == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 404);
                errorResponse.put("resultDesc", "Event not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }
            
            // Send real-time update to all clients
            messagingTemplate.convertAndSend("/topic/calendar/" + event.getCompanyId(), Map.of(
                "action", "UPDATE",
                "event", event
            ));
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Event updated successfully");
            response.put("event", event);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error updating event: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Update event status
    @PutMapping("/events/{eventId}/status")
    public ResponseEntity<?> updateEventStatus(@PathVariable Long eventId, @RequestBody Map<String, String> statusRequest) {
        try {
            String status = statusRequest.get("status");
            if (status == null || status.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 101);
                errorResponse.put("resultDesc", "Status is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            // Validate status value
            if (!status.equals("PENDING") && !status.equals("IN_PROGRESS") && 
                !status.equals("COMPLETED") && !status.equals("CANCELLED")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 102);
                errorResponse.put("resultDesc", "Invalid status value. Must be PENDING, IN_PROGRESS, COMPLETED, or CANCELLED");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            CalendarEvent event = calendarEventService.updateEventStatus(eventId, status);
            if (event == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 404);
                errorResponse.put("resultDesc", "Event not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }
            
            // Send real-time update to all clients
            messagingTemplate.convertAndSend("/topic/calendar/" + event.getCompanyId(), Map.of(
                "action", "STATUS_UPDATE",
                "eventId", eventId,
                "status", status
            ));
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Event status updated successfully");
            response.put("event", event);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error updating event status: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Delete event
    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId) {
        try {
            // Get event before deletion to send WebSocket notification
            CalendarEvent eventToDelete = calendarEventService.getEventById(eventId);
            if (eventToDelete == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 404);
                errorResponse.put("resultDesc", "Event not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            boolean deleted = calendarEventService.deleteEvent(eventId);
            if (!deleted) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 404);
                errorResponse.put("resultDesc", "Event not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }
            
            // Send real-time update to all clients
            messagingTemplate.convertAndSend("/topic/calendar/" + eventToDelete.getCompanyId(), Map.of(
                "action", "DELETE",
                "eventId", eventId
            ));
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Event deleted successfully");
            response.put("eventId", eventId);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error deleting event: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get events by type
    @GetMapping("/events/company/{companyId}/type/{eventType}")
    public ResponseEntity<?> getEventsByType(@PathVariable Long companyId, @PathVariable String eventType) {
        try {
            List<CalendarEvent> events = calendarEventService.getEventsByType(companyId, eventType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Events retrieved successfully");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get events visible to a specific employee
    @GetMapping("/events/company/{companyId}/employee/{employeeId}")
    public ResponseEntity<?> getEventsForEmployee(@PathVariable Long companyId, @PathVariable Long employeeId) {
        try {
            List<CalendarEvent> events = calendarEventService.getEventsVisibleToEmployee(companyId, employeeId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Events retrieved successfully");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get employees assigned to an event
    @GetMapping("/events/{eventId}/employees")
    public ResponseEntity<?> getEventEmployees(@PathVariable Long eventId) {
        try {
            List<Long> employeeIds = calendarEventService.getEmployeeIdsAssignedToEvent(eventId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Event employees retrieved successfully");
            response.put("employeeIds", employeeIds);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving event employees: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Assign employees to an event
    @PostMapping("/events/{eventId}/employees")
    public ResponseEntity<?> assignEmployeesToEvent(@PathVariable Long eventId, @RequestBody Map<String, Object> requestData) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> employeeIds = (List<Long>) requestData.get("employeeIds");
            
            if (employeeIds == null || employeeIds.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 101);
                errorResponse.put("resultDesc", "Employee IDs are required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
            
            calendarEventService.assignEmployeesToEvent(eventId, employeeIds);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Employees assigned to event successfully");
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error assigning employees: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get departments for a company
    @GetMapping("/departments/company/{companyId}")
    public ResponseEntity<?> getUnitsByCompany(@PathVariable Long companyId) {
        try {
            logger.info("Fetching departments for company ID: {}", companyId);
            List<Unit> departments = calendarEventService.getUnitsByCompanyId(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Units retrieved successfully");
            response.put("departments", departments);
            response.put("count", departments.size());
            
            logger.info("Successfully retrieved {} departments for company ID: {}", departments.size(), companyId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error retrieving departments for company ID {}: {}", companyId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving departments: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get designations for a department
    @GetMapping("/designations/department/{departmentId}")
    public ResponseEntity<?> getDesignationsByUnit(@PathVariable Long departmentId) {
        try {
            logger.info("Fetching designations for department ID: {}", departmentId);
            List<Designation> designations = calendarEventService.getDesignationsByUnitId(departmentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Designations retrieved successfully");
            response.put("designations", designations);
            response.put("count", designations.size());
            
            logger.info("Successfully retrieved {} designations for department ID: {}", designations.size(), departmentId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error retrieving designations for department ID {}: {}", departmentId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving designations: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all designations for a company
    @GetMapping("/designations/company/{companyId}")
    public ResponseEntity<?> getAllDesignationsByCompany(@PathVariable Long companyId) {
        try {
            logger.info("Fetching all designations for company ID: {}", companyId);
            List<Designation> designations = calendarEventService.getAllDesignationsByCompanyId(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Designations retrieved successfully");
            response.put("designations", designations);
            response.put("count", designations.size());
            
            logger.info("Successfully retrieved {} designations for company ID: {}", designations.size(), companyId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error retrieving designations for company ID {}: {}", companyId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving designations: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all employees for a company
    @GetMapping("/employees/company/{companyId}")
    public ResponseEntity<?> getEmployeesByCompany(@PathVariable Long companyId) {
        try {
            List<Employee> employees = calendarEventService.getEmployeesByCompanyId(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Employees retrieved successfully");
            response.put("employees", employees);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving employees: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Alias endpoint to support existing frontend search call pattern
    @GetMapping("/api/employees/search")
    public ResponseEntity<?> aliasSearchEmployees(@RequestParam Long companyId, @RequestParam String query) {
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
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error searching employees: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get events for specific employee including their leaves
    @GetMapping("/events/company/{companyId}/employee/{employeeId}/including-leaves")
    public ResponseEntity<?> getEventsForEmployeeIncludingLeaves(
            @PathVariable Long companyId, 
            @PathVariable Long employeeId) {
        try {
            List<CalendarEvent> events = calendarEventService.getEventsForEmployeeIncludingLeaves(companyId, employeeId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Events retrieved successfully including leaves");
            response.put("events", events);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving events: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get approved leaves as calendar events
    @GetMapping("/leaves/company/{companyId}/calendar-events")
    public ResponseEntity<?> getApprovedLeavesAsCalendarEvents(
            @PathVariable Long companyId,
            @RequestParam(required = false) Long employeeId) {
        try {
            List<CalendarEvent> leaveEvents = calendarEventService.getApprovedLeavesAsCalendarEvents(companyId, employeeId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Approved leaves retrieved successfully");
            response.put("events", leaveEvents);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving approved leaves: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Check if employee is on leave on a specific date
    @GetMapping("/leaves/employee/{employeeId}/check")
    public ResponseEntity<?> checkEmployeeLeaveStatus(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date) {
        try {
            boolean isOnLeave = calendarEventService.isEmployeeOnLeave(employeeId, date);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Leave status checked successfully");
            response.put("isOnLeave", isOnLeave);
            response.put("date", date);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error checking leave status: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Search employees by name, email, or employee number
    @GetMapping("/employees/company/{companyId}/search")
    public ResponseEntity<?> searchEmployees(
            @PathVariable Long companyId,
            @RequestParam String query) {
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
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error searching employees: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // Get event visibility details (who the event is assigned to)
    @GetMapping("/events/{eventId}/visibility-details")
    public ResponseEntity<?> getEventVisibilityDetails(@PathVariable Long eventId) {
        try {
            Map<String, Object> details = calendarEventService.getEventVisibilityDetails(eventId);
            
            if (details == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("resultCode", 404);
                errorResponse.put("resultDesc", "Event not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Visibility details retrieved successfully");
            response.put("details", details);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "Error retrieving visibility details: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Debug endpoint to check departments (no auth required for testing)
    @GetMapping("/debug/departments/company/{companyId}")
    public ResponseEntity<?> debugGetUnitsByCompany(@PathVariable Long companyId) {
        try {
            logger.info("DEBUG: Fetching departments for company ID: {}", companyId);
            List<Unit> departments = calendarEventService.getUnitsByCompanyId(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Units retrieved successfully (DEBUG)");
            response.put("departments", departments);
            response.put("count", departments.size());
            response.put("companyId", companyId);
            
            logger.info("DEBUG: Successfully retrieved {} departments for company ID: {}", departments.size(), companyId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("DEBUG: Error retrieving departments for company ID {}: {}", companyId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "DEBUG Error retrieving departments: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Debug endpoint to check designations (no auth required for testing)
    @GetMapping("/debug/designations/company/{companyId}")
    public ResponseEntity<?> debugGetAllDesignationsByCompany(@PathVariable Long companyId) {
        try {
            logger.info("DEBUG: Fetching all designations for company ID: {}", companyId);
            List<Designation> designations = calendarEventService.getAllDesignationsByCompanyId(companyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Designations retrieved successfully (DEBUG)");
            response.put("designations", designations);
            response.put("count", designations.size());
            response.put("companyId", companyId);
            
            logger.info("DEBUG: Successfully retrieved {} designations for company ID: {}", designations.size(), companyId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("DEBUG: Error retrieving designations for company ID {}: {}", companyId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("resultCode", 500);
            errorResponse.put("resultDesc", "DEBUG Error retrieving designations: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
