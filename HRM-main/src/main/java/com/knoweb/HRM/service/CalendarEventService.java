package com.knoweb.HRM.service;

import com.knoweb.HRM.model.CalendarEvent;
import com.knoweb.HRM.model.Unit;
import com.knoweb.HRM.model.Designation;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.EmployeeLeave;
import com.knoweb.HRM.model.EventEmployee;
import com.knoweb.HRM.repository.CalendarEventRepository;
import com.knoweb.HRM.repository.UnitRepository;
import com.knoweb.HRM.repository.DesignationRepository;
import com.knoweb.HRM.repository.EmployeeLeaveRepository;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.repository.EventEmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Arrays;

@Service
public class CalendarEventService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarEventService.class);

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private EventEmployeeRepository eventEmployeeRepository;

    @Autowired
    private EventNotificationService eventNotificationService;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private DesignationRepository designationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeLeaveRepository employeeLeaveRepository;

    @Autowired
    private EmailService emailService;

    // Create a new calendar event
    @Transactional
    public CalendarEvent createEvent(CalendarEvent event) {
        try {
            logger.info("Creating new calendar event: {}", event.getTitle());
            
            // Validate event before saving
            if (event == null) {
                throw new IllegalArgumentException("Event cannot be null");
            }
            if (event.getTitle() == null || event.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Event title cannot be null or empty");
            }
            if (event.getStartDate() == null) {
                throw new IllegalArgumentException("Start date cannot be null");
            }
            // End date is optional if isEndDateOptional is true
            if (event.getIsEndDateOptional() == null) {
                event.setIsEndDateOptional(false); // Set default first
            }
            if (!event.getIsEndDateOptional() && event.getEndDate() == null) {
                throw new IllegalArgumentException("End date cannot be null when end date is required");
            }
            if (event.getCompanyId() == null) {
                throw new IllegalArgumentException("Company ID cannot be null");
            }
            if (event.getEventType() == null || event.getEventType().trim().isEmpty()) {
                throw new IllegalArgumentException("Event type cannot be null or empty");
            }
            if (event.getColor() == null || event.getColor().trim().isEmpty()) {
                throw new IllegalArgumentException("Event color cannot be null or empty");
            }
            if (event.getVisibility() == null || event.getVisibility().trim().isEmpty()) {
                event.setVisibility("ALL_EMPLOYEES"); // Default visibility
            }
            
            // Validate visibility value
            if (!isValidVisibility(event.getVisibility())) {
                throw new IllegalArgumentException("Invalid visibility value: " + event.getVisibility());
            }
            
            // Validate date logic
            if (event.getEndDate() != null && event.getStartDate().isAfter(event.getEndDate())) {
                throw new IllegalArgumentException("Start date cannot be after end date");
            }
            
            // Set default values for null fields
            if (event.getAllDay() == null) {
                event.setAllDay(false);
            }
            if (event.getHasTime() == null) {
                event.setHasTime(true);
            }
            if (event.getIsEndDateOptional() == null) {
                event.setIsEndDateOptional(false);
            }
            
            // Set default end date if it's null
            if (event.getEndDate() == null) {
                if (event.getIsEndDateOptional()) {
                    // For events with optional end date, set end date to start date
                    event.setEndDate(event.getStartDate());
                } else {
                    // For events requiring end date, set it to start date + 1 hour by default
                    event.setEndDate(event.getStartDate().plusHours(1));
                }
            }
            if (event.getStatus() == null || event.getStatus().trim().isEmpty()) {
                event.setStatus("PENDING");
            }
            if (event.getCompletionPercentage() == null) {
                event.setCompletionPercentage(0);
            }
            
            // Process department selections (handles "All Departments" logic)
            if (event.getSelectedDepartments() != null) {
                String processedDepartments = processDepartmentSelections(event.getSelectedDepartments(), event.getCompanyId());
                event.setSelectedDepartments(processedDepartments);
            }
            
            CalendarEvent savedEvent = calendarEventRepository.save(event);
            logger.info("Successfully created calendar event with ID: {}", savedEvent.getId());
            
            // Send email notifications to selected employees
            if ("SELECTED_EMPLOYEES".equals(savedEvent.getVisibility()) && savedEvent.getEmployeeIds() != null) {
                try {
                    List<Long> employeeIds = parseEmployeeIds(savedEvent.getEmployeeIds());
                    if (!employeeIds.isEmpty()) {
                        emailService.sendCalendarEventNotification(savedEvent, employeeIds);
                        logger.info("Sent email notifications to {} employees for event ID: {}", employeeIds.size(), savedEvent.getId());
                    }
                } catch (Exception e) {
                    logger.error("Failed to send email notifications for event ID {}: {}", savedEvent.getId(), e.getMessage());
                    // Don't throw exception here - email failure shouldn't break event creation
                }
            }
            
            return savedEvent;
            
        } catch (Exception e) {
            logger.error("Error creating calendar event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create calendar event: " + e.getMessage(), e);
        }
    }

    // Get all events for a company
    public List<CalendarEvent> getAllEventsByCompanyId(Long companyId) {
        return calendarEventRepository.findByCompanyId(companyId);
    }

    // Get event by ID
    public CalendarEvent getEventById(Long eventId) {
        Optional<CalendarEvent> event = calendarEventRepository.findById(eventId);
        return event.orElse(null);
    }

    // Update an existing event
    @Transactional
    public CalendarEvent updateEvent(Long eventId, CalendarEvent updatedEvent) {
        try {
            logger.info("Updating calendar event with ID: {}", eventId);
            
            if (eventId == null) {
                throw new IllegalArgumentException("Event ID cannot be null");
            }
            
            if (updatedEvent == null) {
                throw new IllegalArgumentException("Updated event data cannot be null");
            }
            
            Optional<CalendarEvent> existingEventOpt = calendarEventRepository.findById(eventId);
            if (!existingEventOpt.isPresent()) {
                logger.warn("Calendar event not found with ID: {}", eventId);
                return null;
            }
            
            CalendarEvent event = existingEventOpt.get();
            
            // Update fields with null checks
            if (updatedEvent.getTitle() != null && !updatedEvent.getTitle().trim().isEmpty()) {
                event.setTitle(updatedEvent.getTitle());
            }
            if (updatedEvent.getDescription() != null) {
                event.setDescription(updatedEvent.getDescription());
            }
            if (updatedEvent.getStartDate() != null) {
                event.setStartDate(updatedEvent.getStartDate());
            }
            if (updatedEvent.getEndDate() != null) {
                event.setEndDate(updatedEvent.getEndDate());
            }
            if (updatedEvent.getEventType() != null && !updatedEvent.getEventType().trim().isEmpty()) {
                event.setEventType(updatedEvent.getEventType());
            }
            if (updatedEvent.getColor() != null && !updatedEvent.getColor().trim().isEmpty()) {
                event.setColor(updatedEvent.getColor());
            }
            if (updatedEvent.getAllDay() != null) {
                event.setAllDay(updatedEvent.getAllDay());
            }
            if (updatedEvent.getLocation() != null) {
                event.setLocation(updatedEvent.getLocation());
            }
            
            // Update status if provided and valid
            if (updatedEvent.getStatus() != null && !updatedEvent.getStatus().trim().isEmpty()) {
                if (isValidStatus(updatedEvent.getStatus())) {
                    event.setStatus(updatedEvent.getStatus());
                } else {
                    logger.warn("Invalid status value provided: {}", updatedEvent.getStatus());
                }
            }
            
            // Update other fields if provided
            if (updatedEvent.getCompletionPercentage() != null) {
                int percentage = updatedEvent.getCompletionPercentage();
                if (percentage >= 0 && percentage <= 100) {
                    event.setCompletionPercentage(percentage);
                } else {
                    logger.warn("Invalid completion percentage: {}. Must be between 0 and 100", percentage);
                }
            }
            if (updatedEvent.getHasTime() != null) {
                event.setHasTime(updatedEvent.getHasTime());
            }
            if (updatedEvent.getIsEndDateOptional() != null) {
                event.setIsEndDateOptional(updatedEvent.getIsEndDateOptional());
            }
            if (updatedEvent.getVisibility() != null && !updatedEvent.getVisibility().trim().isEmpty()) {
                if (isValidVisibility(updatedEvent.getVisibility())) {
                    event.setVisibility(updatedEvent.getVisibility());
                } else {
                    logger.warn("Invalid visibility value provided: {}", updatedEvent.getVisibility());
                }
            }
            
            // Handle departmentId (can be null)
            event.setUnitId(updatedEvent.getUnitId());
            // Handle designationIds (can be null)
            event.setDesignationIds(updatedEvent.getDesignationIds());
            
            // Validate date logic after updates
            if (event.getStartDate().isAfter(event.getEndDate())) {
                throw new IllegalArgumentException("Start date cannot be after end date");
            }
            
            CalendarEvent savedEvent = calendarEventRepository.save(event);
            logger.info("Successfully updated calendar event with ID: {}", savedEvent.getId());
            return savedEvent;
        } catch (Exception e) {
            logger.error("Error updating calendar event with ID {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to update calendar event: " + e.getMessage(), e);
        }
    }

    // Update event status only
    public CalendarEvent updateEventStatus(Long eventId, String status) {
        try {
            if (eventId == null) {
                throw new IllegalArgumentException("Event ID cannot be null");
            }
            
            if (status == null || status.trim().isEmpty()) {
                throw new IllegalArgumentException("Status cannot be null or empty");
            }
            
            if (!isValidStatus(status)) {
                throw new IllegalArgumentException("Invalid status value: " + status);
            }
            
            Optional<CalendarEvent> existingEventOpt = calendarEventRepository.findById(eventId);
            if (!existingEventOpt.isPresent()) {
                logger.warn("Calendar event not found with ID: {}", eventId);
                return null;
            }
            
            CalendarEvent event = existingEventOpt.get();
            event.setStatus(status);
            CalendarEvent savedEvent = calendarEventRepository.save(event);
            
            logger.info("Successfully updated status for event ID {} to {}", eventId, status);
            return savedEvent;
        } catch (Exception e) {
            logger.error("Error updating event status for ID {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to update event status: " + e.getMessage(), e);
        }
    }

    // Delete an event
    public boolean deleteEvent(Long eventId) {
        if (calendarEventRepository.existsById(eventId)) {
            calendarEventRepository.deleteById(eventId);
            return true;
        }
        return false;
    }

    // Get events for a specific date range
    public List<CalendarEvent> getEventsByDateRange(Long companyId, LocalDateTime startDate, LocalDateTime endDate) {
        return calendarEventRepository.findByCompanyIdAndDateRange(companyId, startDate, endDate);
    }

    // Get events for a specific month
    public List<CalendarEvent> getEventsByMonth(Long companyId, int year, int month) {
        return calendarEventRepository.findByCompanyIdAndMonth(companyId, year, month);
    }

    // Get events by type
    public List<CalendarEvent> getEventsByType(Long companyId, String eventType) {
        return calendarEventRepository.findByCompanyIdAndEventType(companyId, eventType);
    }

    // Get upcoming events
    public List<CalendarEvent> getUpcomingEvents(Long companyId) {
        return calendarEventRepository.findUpcomingEvents(companyId, LocalDateTime.now());
    }

    // Get today's events
    public List<CalendarEvent> getTodayEvents(Long companyId) {
        return calendarEventRepository.findTodayEvents(companyId);
    }

    // Check if event time conflicts exist
    public boolean hasTimeConflict(Long companyId, LocalDateTime startDate, LocalDateTime endDate, Long excludeEventId) {
        List<CalendarEvent> existingEvents = calendarEventRepository.findByCompanyIdAndDateRange(companyId, startDate, endDate);
        
        for (CalendarEvent event : existingEvents) {
            if (excludeEventId != null && event.getId().equals(excludeEventId)) {
                continue; // Skip the event being updated
            }
            
            // Check for overlap
            if (isTimeOverlap(startDate, endDate, event.getStartDate(), event.getEndDate())) {
                return true;
            }
        }
        return false;
    }

    // Helper method to check time overlap
    private boolean isTimeOverlap(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    // Get events count by type for dashboard
    public long getEventsCountByType(Long companyId, String eventType) {
        return calendarEventRepository.findByCompanyIdAndEventType(companyId, eventType).size();
    }

    // Get events visible to a specific employee
    public List<CalendarEvent> getEventsVisibleToEmployee(Long companyId, Long employeeId) {
        List<CalendarEvent> allEvents = calendarEventRepository.findByCompanyId(companyId);
        List<CalendarEvent> visibleEvents = new ArrayList<>();
        
        for (CalendarEvent event : allEvents) {
            if (isEventVisibleToEmployee(event, employeeId)) {
                visibleEvents.add(event);
            }
        }
        
        return visibleEvents;
    }

    // Check if an event is visible to a specific employee
    private boolean isEventVisibleToEmployee(CalendarEvent event, Long employeeId) {
        String visibility = event.getVisibility();
        
        if ("ALL_EMPLOYEES".equals(visibility)) {
            return true;
        } else if ("SELECTED_EMPLOYEES".equals(visibility)) {
            return eventEmployeeRepository.existsByEventIdAndEmployeeId(event.getId(), employeeId);
        } else if ("COMPANY_ONLY".equals(visibility)) {
            // Only visible to company admins or creators
            return event.getCreatedBy() != null && event.getCreatedBy().equals(employeeId);
        } else if ("DEPARTMENT".equals(visibility)) {
            return isEventVisibleToEmployeeByUnit(event, employeeId);
        } else if ("DESIGNATION".equals(visibility)) {
            return isEventVisibleToEmployeeByDesignation(event, employeeId);
        }
        
        return false;
    }

    // Assign employees to an event
    @Transactional
    public void assignEmployeesToEvent(Long eventId, List<Long> employeeIds) {
        CalendarEvent event = getEventById(eventId);
        if (event == null) {
            throw new RuntimeException("Event not found");
        }
        
        // Remove existing assignments
        eventEmployeeRepository.deleteByEventId(eventId);
        
        // Add new assignments
        for (Long employeeId : employeeIds) {
            EventEmployee eventEmployee = new EventEmployee();
            eventEmployee.setEvent(event);
            eventEmployee.setEmployeeId(employeeId);
            eventEmployee.setCompanyId(event.getCompanyId());
            eventEmployee.setNotificationSent(false);
            eventEmployeeRepository.save(eventEmployee);
        }
        
        // Send notifications to assigned employees
        eventNotificationService.sendEventNotifications(event, employeeIds);
    }

    // Get employees assigned to an event
    public List<Long> getEmployeeIdsAssignedToEvent(Long eventId) {
        return eventEmployeeRepository.findEmployeeIdsByEventId(eventId);
    }

    // Get departments for a company
    public List<Unit> getUnitsByCompanyId(Long companyId) {
        try {
            logger.info("Fetching departments for company ID: {}", companyId);
            List<Unit> departments = unitRepository.findByCmpId(companyId);
            logger.info("Found {} departments for company ID: {}", departments.size(), companyId);
            for (Unit dept : departments) {
                logger.debug("Unit: {} (ID: {})", dept.getDpt_name(), dept.getId());
            }
            return departments;
        } catch (Exception e) {
            logger.error("Error fetching departments for company ID {}: {}", companyId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch departments: " + e.getMessage(), e);
        }
    }

    // Get designations for a department
    public List<Designation> getDesignationsByUnitId(Long departmentId) {
        try {
            logger.info("Fetching designations for department ID: {}", departmentId);
            List<Designation> designations = designationRepository.findByDptId(departmentId);
            logger.info("Found {} designations for department ID: {}", designations.size(), departmentId);
            for (Designation desig : designations) {
                logger.debug("Designation: {} (ID: {})", desig.getDesignation(), desig.getId());
            }
            return designations;
        } catch (Exception e) {
            logger.error("Error fetching designations for department ID {}: {}", departmentId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch designations: " + e.getMessage(), e);
        }
    }

    // Get all designations for a company
    public List<Designation> getAllDesignationsByCompanyId(Long companyId) {
        try {
            logger.info("Fetching all designations for company ID: {}", companyId);
            List<Unit> departments = unitRepository.findByCmpId(companyId);
            List<Long> departmentIds = departments.stream()
                    .map(dept -> dept.getId())
                    .collect(Collectors.toList());
            
            List<Designation> allDesignations = designationRepository.findAll().stream()
                    .filter(d -> departmentIds.contains(d.getDptId()))
                    .collect(Collectors.toList());
            
            logger.info("Found {} designations for company ID: {}", allDesignations.size(), companyId);
            return allDesignations;
        } catch (Exception e) {
            logger.error("Error fetching all designations for company ID {}: {}", companyId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch all designations: " + e.getMessage(), e);
        }
    }

    // Process department selections - handles "All Departments" (-1) logic
    private String processDepartmentSelections(String selectedDepartmentsJson, Long companyId) {
        try {
            if (selectedDepartmentsJson == null || selectedDepartmentsJson.trim().isEmpty()) {
                return "[]";
            }
            
            List<Long> departmentIds = new ArrayList<>();
            List<Long> selectedDeps = new ArrayList<>();
            
            // Parse the JSON array
            if (selectedDepartmentsJson.startsWith("[") && selectedDepartmentsJson.endsWith("]")) {
                String[] ids = selectedDepartmentsJson.substring(1, selectedDepartmentsJson.length() - 1).split(",");
                for (String id : ids) {
                    if (!id.trim().isEmpty()) {
                        selectedDeps.add(Long.parseLong(id.trim()));
                    }
                }
            }
            
            // Check if "All Departments" (-1) is selected
            if (selectedDeps.contains(-1L)) {
                // Get all departments for the company
                List<Unit> allDepartments = unitRepository.findByCmpId(companyId);
                departmentIds = allDepartments.stream()
                    .map(Unit::getId)
                    .collect(Collectors.toList());
            } else {
                // Use the selected departments
                departmentIds = selectedDeps;
            }
            
            // Convert back to JSON
            return departmentIds.toString();
        } catch (Exception e) {
            logger.error("Error processing department selections: {}", e.getMessage(), e);
            return "[]";
        }
    }

    // Check if event is visible to employee based on department
    private boolean isEventVisibleToEmployeeByUnit(CalendarEvent event, Long employeeId) {
        if (event.getUnitId() == null) {
            return false;
        }
        
        try {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            if (employee == null) {
                return false;
            }
            
            return java.util.Objects.equals(employee.getDptId(), event.getUnitId());
        } catch (Exception e) {
            logger.error("Error checking department visibility for employee {}: {}", employeeId, e.getMessage());
            return false;
        }
    }
    
    // Check if event is visible to employee based on designation
    private boolean isEventVisibleToEmployeeByDesignation(CalendarEvent event, Long employeeId) {
        if (event.getDesignationIds() == null || event.getDesignationIds().trim().isEmpty()) {
            return false;
        }
        
        try {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            if (employee == null) {
                return false;
            }
            
            // Parse the designation IDs JSON string
            String[] designationIdStrings = event.getDesignationIds().replace("[", "").replace("]", "").split(",");
            for (String designationIdStr : designationIdStrings) {
                if (!designationIdStr.trim().isEmpty()) {
                    try {
                        long designationId = Long.parseLong(designationIdStr.trim());
                        if (employee.getDesignationId() == designationId) {
                            return true;
                        }
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid designation ID format: {}", designationIdStr);
                    }
                }
            }
            
            return false;
        } catch (Exception e) {
            logger.error("Error checking designation visibility for employee {}: {}", employeeId, e.getMessage());
            return false;
        }
    }

    // Search employees by ID, name, or email
    public List<Employee> searchEmployees(Long companyId, String query) {
        return employeeRepository.searchEmployees(companyId, query);
    }

    // Get all employees for a company
    public List<Employee> getEmployeesByCompanyId(Long companyId) {
        return employeeRepository.findEmployeesByCompanyIdWithDetails(companyId);
    }

    // Get approved employee leaves for calendar integration
    public List<CalendarEvent> getApprovedLeavesAsCalendarEvents(Long companyId, Long employeeId) {
        try {
            List<EmployeeLeave> approvedLeaves;
            
            if (employeeId != null) {
                // Get leaves for specific employee
                approvedLeaves = employeeLeaveRepository.findByEmpIdAndLeaveStatus(employeeId, "APPROVED");
            } else {
                // Get all approved leaves for company
                approvedLeaves = employeeLeaveRepository.findByLeaveStatusAndCompanyId("APPROVED", companyId);
            }
            
            List<CalendarEvent> leaveEvents = new ArrayList<>();
            
            for (EmployeeLeave leave : approvedLeaves) {
                CalendarEvent leaveEvent = convertLeaveToCalendarEvent(leave, companyId);
                if (leaveEvent != null) {
                    leaveEvents.add(leaveEvent);
                }
            }
            
            return leaveEvents;
        } catch (Exception e) {
            logger.error("Error retrieving approved leaves for calendar: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve approved leaves: " + e.getMessage(), e);
        }
    }
    
    // Convert EmployeeLeave to CalendarEvent for calendar display
    private CalendarEvent convertLeaveToCalendarEvent(EmployeeLeave leave, Long companyId) {
        try {
            if (leave.getLeaveStartDay() == null || leave.getLeaveEndDay() == null) {
                logger.warn("Leave record {} has null dates", leave.getId());
                return null;
            }
            
            CalendarEvent event = new CalendarEvent();
            event.setTitle("Leave - " + (leave.getLeaveType() != null ? leave.getLeaveType() : "Leave"));
            event.setDescription(leave.getLeaveReason());
            event.setStartDate(leave.getLeaveStartDay());
            event.setEndDate(leave.getLeaveEndDay());
            event.setEventType("LEAVE");
            event.setColor("#FF6B6B"); // Red color for leaves
            event.setAllDay(true);
            event.setHasTime(false);
            event.setCompanyId(companyId);
            event.setCreatedBy(leave.getEmpId());
            event.setStatus("APPROVED");
            event.setVisibility("SELECTED_EMPLOYEES"); // Only visible to relevant people
            
            // Set the event ID as a negative number to distinguish from regular events
            event.setId(-leave.getId());
            
            return event;
        } catch (Exception e) {
            logger.error("Error converting leave {} to calendar event: {}", leave.getId(), e.getMessage());
            return null;
        }
    }
    
    // Get events for a specific employee including their leaves
    public List<CalendarEvent> getEventsForEmployeeIncludingLeaves(Long companyId, Long employeeId) {
        List<CalendarEvent> regularEvents = getEventsVisibleToEmployee(companyId, employeeId);
        List<CalendarEvent> leaveEvents = getApprovedLeavesAsCalendarEvents(companyId, employeeId);
        
        // Combine both lists
        List<CalendarEvent> allEvents = new ArrayList<>(regularEvents);
        allEvents.addAll(leaveEvents);
        
        return allEvents;
    }
    
    // Check if employee is on leave on a specific date
    public boolean isEmployeeOnLeave(Long employeeId, LocalDateTime date) {
        try {
            List<EmployeeLeave> approvedLeaves = employeeLeaveRepository.findByEmpIdAndLeaveStatus(employeeId, "APPROVED");
            
            for (EmployeeLeave leave : approvedLeaves) {
                if (leave.getLeaveStartDay() != null && leave.getLeaveEndDay() != null) {
                    if (!date.isBefore(leave.getLeaveStartDay()) && !date.isAfter(leave.getLeaveEndDay())) {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (Exception e) {
            logger.error("Error checking leave status for employee {}: {}", employeeId, e.getMessage());
            return false;
        }
    }
    
    // Validation helper methods
    private boolean isValidStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return false;
        }
        
        String upperStatus = status.toUpperCase().trim();
        return "PENDING".equals(upperStatus) || 
               "IN_PROGRESS".equals(upperStatus) || 
               "COMPLETED".equals(upperStatus) || 
               "CANCELLED".equals(upperStatus);
    }
    
    private boolean isValidVisibility(String visibility) {
        if (visibility == null || visibility.trim().isEmpty()) {
            return false;
        }
        
        String upperVisibility = visibility.toUpperCase().trim();
        return "ALL_EMPLOYEES".equals(upperVisibility) || 
               "SELECTED_EMPLOYEES".equals(upperVisibility) || 
               "COMPANY_ONLY".equals(upperVisibility) || 
               "DEPARTMENT".equals(upperVisibility) || 
               "DESIGNATION".equals(upperVisibility);
    }
    
    // Helper methods for employee assignments
    @Transactional
    public void assignEmployeesInUnit(Long eventId, Long departmentId) {
        try {
            // Clear existing assignments
            eventEmployeeRepository.deleteByEventId(eventId);
            
            // Get all employees in the department
            List<Employee> employees = employeeRepository.findByDptId(departmentId);
            
            // Assign all employees to the event
            for (Employee employee : employees) {
                EventEmployee eventEmployee = new EventEmployee();
                CalendarEvent eventRef = new CalendarEvent();
                eventRef.setId(eventId);
                eventEmployee.setEvent(eventRef);
                eventEmployee.setEmployeeId(employee.getId());
                eventEmployee.setCompanyId(employee.getCmpId());
                eventEmployee.setNotificationSent(false);
                eventEmployeeRepository.save(eventEmployee);
            }
            
            logger.info("Assigned {} employees from department {} to event {}", 
                       employees.size(), departmentId, eventId);
        } catch (Exception e) {
            logger.error("Error assigning employees in department {} to event {}: {}", 
                        departmentId, eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to assign employees: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void assignEmployeesByDesignations(Long eventId, String designationIdsJson) {
        try {
            // Clear existing assignments
            eventEmployeeRepository.deleteByEventId(eventId);
            
            if (designationIdsJson == null || designationIdsJson.trim().isEmpty()) {
                logger.warn("No designation IDs provided for event {}", eventId);
                return;
            }
            
            // Normalize string: remove brackets and quotes, then split by comma
            String normalized = designationIdsJson
                    .replace("[", "")
                    .replace("]", "")
                    .replace("\"", "")
                    .trim();
            
            List<Long> designationIds = new ArrayList<>();
            if (!normalized.isEmpty()) {
                String[] designationIdStrings = normalized.split(",");
                for (String idStr : designationIdStrings) {
                    String s = idStr.trim();
                    if (!s.isEmpty()) {
                        try {
                            designationIds.add(Long.parseLong(s));
                        } catch (NumberFormatException e) {
                            logger.warn("Invalid designation ID: {}", s);
                        }
                    }
                }
            }
            
            if (designationIds.isEmpty()) {
                logger.warn("Parsed empty designation ID list for event {} from input: {}", eventId, designationIdsJson);
                return;
            }
            
            // Get all employees with the specified designations
            List<Employee> employees = new ArrayList<>();
            for (Long designationId : designationIds) {
                List<Employee> employeesWithDesignation = employeeRepository.findByDesignationId(designationId);
                employees.addAll(employeesWithDesignation);
            }
            
            // Remove duplicates
            List<Employee> uniqueEmployees = employees.stream()
                .distinct()
                .collect(java.util.stream.Collectors.toList());
            
            // Assign all employees to the event
            for (Employee employee : uniqueEmployees) {
                EventEmployee eventEmployee = new EventEmployee();
                CalendarEvent eventRef = new CalendarEvent();
                eventRef.setId(eventId);
                eventEmployee.setEvent(eventRef);
                eventEmployee.setEmployeeId(employee.getId());
                eventEmployee.setCompanyId(employee.getCmpId());
                eventEmployee.setNotificationSent(false);
                eventEmployeeRepository.save(eventEmployee);
            }
            
            logger.info("Assigned {} employees with designations {} to event {}", 
                       uniqueEmployees.size(), designationIds, eventId);
        } catch (Exception e) {
            logger.error("Error assigning employees by designations {} to event {}: {}", 
                        designationIdsJson, eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to assign employees: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void assignSelectedEmployees(Long eventId, List<Long> employeeIds) {
        try {
            // Clear existing assignments
            eventEmployeeRepository.deleteByEventId(eventId);
            
            // Assign selected employees
            for (Long employeeId : employeeIds) {
                EventEmployee eventEmployee = new EventEmployee();
                CalendarEvent eventRef = new CalendarEvent();
                eventRef.setId(eventId);
                eventEmployee.setEvent(eventRef);
                eventEmployee.setEmployeeId(employeeId);
                
                // Get employee to find company ID
                Employee employee = employeeRepository.findById(employeeId).orElse(null);
                if (employee != null) {
                    eventEmployee.setCompanyId(employee.getCmpId());
                    eventEmployee.setNotificationSent(false);
                    eventEmployeeRepository.save(eventEmployee);
                }
            }
            
            logger.info("Assigned {} selected employees to event {}", employeeIds.size(), eventId);
        } catch (Exception e) {
            logger.error("Error assigning selected employees to event {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to assign employees: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void clearEmployeeAssignments(Long eventId) {
        try {
            eventEmployeeRepository.deleteByEventId(eventId);
            logger.info("Cleared all employee assignments for event {}", eventId);
        } catch (Exception e) {
            logger.error("Error clearing assignments for event {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to clear assignments: " + e.getMessage(), e);
        }
    }
    
    // Get event visibility details (who the event is assigned to)
    public Map<String, Object> getEventVisibilityDetails(Long eventId) {
        try {
            CalendarEvent event = calendarEventRepository.findById(eventId).orElse(null);
            if (event == null) {
                return null;
            }
            
            Map<String, Object> details = new HashMap<>();
            details.put("eventId", eventId);
            details.put("visibility", event.getVisibility());
            details.put("departmentId", event.getUnitId());
            details.put("designationIds", event.getDesignationIds());
            
            switch (event.getVisibility()) {
                case "DEPARTMENT":
                    if (event.getUnitId() != null) {
                        Unit department = unitRepository.findById(event.getUnitId()).orElse(null);
                        if (department != null) {
                            details.put("departmentName", department.getDpt_name());
                            List<Employee> employees = employeeRepository.findByDptId(event.getUnitId());
                            details.put("assignedEmployees", employees);
                            details.put("assignedCount", employees.size());
                        }
                    }
                    break;
                    
                case "DESIGNATION":
                    if (event.getDesignationIds() != null && !event.getDesignationIds().trim().isEmpty()) {
                        String[] designationIdStrings = event.getDesignationIds().replace("[", "").replace("]", "").split(",");
                        List<Long> designationIds = new ArrayList<>();
                        List<Designation> designations = new ArrayList<>();
                        
                        for (String idStr : designationIdStrings) {
                            if (!idStr.trim().isEmpty()) {
                                try {
                                    Long designationId = Long.parseLong(idStr.trim());
                                    designationIds.add(designationId);
                                    Designation designation = designationRepository.findById(designationId).orElse(null);
                                    if (designation != null) {
                                        designations.add(designation);
                                    }
                                } catch (NumberFormatException e) {
                                    logger.warn("Invalid designation ID: {}", idStr);
                                }
                            }
                        }
                        
                        details.put("designationList", designations);
                        
                        // Get all employees with these designations
                        Set<Employee> allEmployees = new HashSet<>();
                        for (Long designationId : designationIds) {
                            List<Employee> employees = employeeRepository.findByDesignationId(designationId);
                            allEmployees.addAll(employees);
                        }
                        
                        details.put("assignedEmployees", new ArrayList<>(allEmployees));
                        details.put("assignedCount", allEmployees.size());
                    }
                    break;
                    
                case "SELECTED_EMPLOYEES":
                    List<EventEmployee> eventEmployees = eventEmployeeRepository.findByEventId(eventId);
                    List<Employee> selectedEmployees = new ArrayList<>();
                    
                    for (EventEmployee eventEmployee : eventEmployees) {
                        Employee employee = employeeRepository.findById(eventEmployee.getEmployeeId()).orElse(null);
                        if (employee != null) {
                            selectedEmployees.add(employee);
                        }
                    }
                    
                    details.put("assignedEmployees", selectedEmployees);
                    details.put("assignedCount", selectedEmployees.size());
                    break;
                    
                case "ALL_EMPLOYEES":
                    List<Employee> allCompanyEmployees = employeeRepository.findByCmpId(event.getCompanyId());
                    details.put("assignedEmployees", allCompanyEmployees);
                    details.put("assignedCount", allCompanyEmployees.size());
                    break;
                    
                case "COMPANY_ONLY":
                    // Only visible to creator and admins
                    Employee creator = employeeRepository.findById(event.getCreatedBy()).orElse(null);
                    if (creator != null) {
                        details.put("creator", creator);
                        details.put("assignedEmployees", List.of(creator));
                        details.put("assignedCount", 1);
                    }
                    break;
            }
            
            return details;
        } catch (Exception e) {
            logger.error("Error getting visibility details for event {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to get visibility details: " + e.getMessage(), e);
        }
    }
    
    // Enhanced employee search for event creation
    public List<Employee> searchEmployees(String query, Long companyId) {
        try {
            logger.info("Searching employees with query '{}' for company ID: {}", query, companyId);
            
            // Normalize query for case-insensitive search
            String normalizedQuery = query.toLowerCase().trim();
            
            // Search across multiple fields
            List<Employee> allEmployees = employeeRepository.findByCmpId(companyId);
            
            List<Employee> filteredEmployees = allEmployees.stream()
                .filter(emp -> {
                    // Search by employee ID
                    if (emp.getEmp_no() != null && emp.getEmp_no().toLowerCase().contains(normalizedQuery)) {
                        return true;
                    }
                    
                    // Search by EPF number
                    if (emp.getEpf_no() != null && emp.getEpf_no().toLowerCase().contains(normalizedQuery)) {
                        return true;
                    }
                    
                    // Search by first name
                    if (emp.getFirst_name() != null && emp.getFirst_name().toLowerCase().contains(normalizedQuery)) {
                        return true;
                    }
                    
                    // Search by last name
                    if (emp.getLast_name() != null && emp.getLast_name().toLowerCase().contains(normalizedQuery)) {
                        return true;
                    }
                    
                    // Search by full name
                    String fullName = (emp.getFirst_name() + " " + emp.getLast_name()).toLowerCase();
                    if (fullName.contains(normalizedQuery)) {
                        return true;
                    }
                    
                    // Search by email
                    if (emp.getEmail() != null && emp.getEmail().toLowerCase().contains(normalizedQuery)) {
                        return true;
                    }
                    
                    // Search by department
                    if (emp.getDepartment() != null) {
                        String deptName = emp.getDepartment() instanceof Unit ? 
                            ((Unit) emp.getDepartment()).getDpt_name().toLowerCase() :
                            emp.getDepartment().toString().toLowerCase();
                        if (deptName.contains(normalizedQuery)) {
                            return true;
                        }
                    }
                    
                    // Search by designation
                    if (emp.getDesignation() != null) {
                        String designationName = emp.getDesignation() instanceof Designation ? 
                            ((Designation) emp.getDesignation()).getDesignation().toLowerCase() :
                            emp.getDesignation().toString().toLowerCase();
                        if (designationName.contains(normalizedQuery)) {
                            return true;
                        }
                    }
                    
                    return false;
                })
                .limit(20) // Limit results for performance
                .collect(Collectors.toList());
            
            logger.info("Found {} employees matching query '{}' for company ID: {}", 
                filteredEmployees.size(), normalizedQuery, companyId);
            
            return filteredEmployees;
            
        } catch (Exception e) {
            logger.error("Error searching employees with query '{}' for company ID {}: {}", 
                query, companyId, e.getMessage(), e);
            throw new RuntimeException("Failed to search employees: " + e.getMessage(), e);
        }
    }
    
    // Assign employees by IDs for SELECTED_EMPLOYEES visibility
    public void assignEmployeesByIds(Long eventId, String employeeIdsJson) {
        try {
            logger.info("Assigning employees by IDs for event ID: {}", eventId);
            
            if (employeeIdsJson == null || employeeIdsJson.trim().isEmpty()) {
                logger.warn("No employee IDs provided for event ID: {}", eventId);
                return;
            }
            
            // Parse JSON array of employee IDs
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<Long> employeeIds = mapper.readValue(employeeIdsJson, 
                mapper.getTypeFactory().constructCollectionType(List.class, Long.class));
            
            // Clear existing assignments
            eventEmployeeRepository.deleteByEventId(eventId);
            
            // Create new assignments
            for (Long employeeId : employeeIds) {
                EventEmployee assignment = new EventEmployee();
                assignment.setEmployeeId(employeeId);
                assignment.setCompanyId(1L); // TODO: Get actual company ID from event
                assignment.setCreatedAt(LocalDateTime.now());
                eventEmployeeRepository.save(assignment);
            }
            
            logger.info("Successfully assigned {} employees to event ID: {}", employeeIds.size(), eventId);
            
        } catch (Exception e) {
            logger.error("Error assigning employees by IDs for event ID {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to assign employees: " + e.getMessage(), e);
        }
    }
    
    // Get selected employees for an event
    private List<Employee> getSelectedEmployees(Long eventId) {
        try {
            List<Long> employeeIds = eventEmployeeRepository.findEmployeeIdsByEventId(eventId);
            return employeeRepository.findAllById(employeeIds);
        } catch (Exception e) {
            logger.error("Error getting selected employees for event ID {}: {}", eventId, e.getMessage(), e);
            return List.of();
        }
    }
    
    // Get employees by designations
    private List<Employee> getEmployeesByDesignations(String designationIdsJson) {
        try {
            if (designationIdsJson == null || designationIdsJson.trim().isEmpty()) {
                return List.of();
            }
            
            // Parse JSON array of designation IDs
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<Long> designationIds = mapper.readValue(designationIdsJson, 
                mapper.getTypeFactory().constructCollectionType(List.class, Long.class));
            
            List<Employee> employees = new ArrayList<>();
            for (Long designationId : designationIds) {
                List<Employee> empList = employeeRepository.findByDesignationId(designationId);
                employees.addAll(empList);
            }
            
            return employees.stream().distinct().collect(Collectors.toList());
            
        } catch (Exception e) {
            logger.error("Error getting employees by designations: {}", e.getMessage(), e);
            return List.of();
        }
    }
    
    // Send email notifications for new events
    public void sendEventNotifications(CalendarEvent event) {
        try {
            logger.info("Sending email notifications for event ID: {}", event.getId());
            
            // Get all employees who should receive this notification
            List<Employee> recipients = getEventNotificationRecipients(event);
            
            if (recipients.isEmpty()) {
                logger.info("No recipients found for event ID: {}", event.getId());
                return;
            }
            
            // Prepare email content
            String subject = "New Event: " + event.getTitle();
            String emailContent = buildEventNotificationEmail(event);
            
            // Send emails (this would integrate with your existing EmailService)
            for (Employee employee : recipients) {
                try {
                    // emailService.sendEmail(employee.getEmail(), subject, emailContent);
                    logger.info("Event notification sent to employee: {} ({})", 
                        employee.getEmail(), event.getId());
                } catch (Exception e) {
                    logger.error("Failed to send event notification to employee {}: {}", 
                        employee.getEmail(), e.getMessage());
                }
            }
            
            logger.info("Completed sending {} email notifications for event ID: {}", 
                recipients.size(), event.getId());
            
        } catch (Exception e) {
            logger.error("Error sending event notifications for event ID {}: {}", 
                event.getId(), e.getMessage(), e);
            // Don't throw exception here - email failure shouldn't break event creation
        }
    }
    
    // Get recipients for event notifications
    private List<Employee> getEventNotificationRecipients(CalendarEvent event) {
        try {
            String visibility = event.getVisibility();
            
            switch (visibility) {
                case "COMPANY_ONLY":
                case "ALL_EMPLOYEES":
                    return employeeRepository.findByCmpId(event.getCompanyId());
                    
                case "SELECTED_EMPLOYEES":
                    return getSelectedEmployees(event.getId());
                    
                case "DEPARTMENT":
                    if (event.getUnitId() != null) {
                        return employeeRepository.findByDptId(event.getUnitId());
                    }
                    break;
                    
                case "DESIGNATION":
                    if (event.getDesignationIds() != null) {
                        return getEmployeesByDesignations(event.getDesignationIds());
                    }
                    break;
                    
                default:
                    return List.of();
            }
            
            return List.of();
            
        } catch (Exception e) {
            logger.error("Error getting event notification recipients for event ID {}: {}", 
                event.getId(), e.getMessage(), e);
            return List.of();
        }
    }
    
    // Build email content for event notifications
    private String buildEventNotificationEmail(CalendarEvent event) {
        StringBuilder content = new StringBuilder();
        
        content.append("<html><body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
        content.append("<div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>");
        
        // Header
        content.append("<h2 style='color: #333; margin-bottom: 20px;'>📅 New Event Notification</h2>");
        
        // Event details
        content.append("<div style='background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid ").append(event.getColor()).append(";'>");
        content.append("<h3 style='color: #333; margin-top: 0;'>").append(event.getTitle()).append("</h3>");
        
        if (event.getDescription() != null && !event.getDescription().trim().isEmpty()) {
            content.append("<p style='color: #666; margin-bottom: 15px;'>").append(event.getDescription()).append("</p>");
        }
        
        // Event details table
        content.append("<table style='width: 100%; border-collapse: collapse;'>");
        
        // Event type
        content.append("<tr><td style='padding: 8px; font-weight: bold; color: #555;'>Type:</td>");
        content.append("<td style='padding: 8px; color: #333;'>").append(event.getEventType()).append("</td></tr>");
        
        // Date and time
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        
        content.append("<tr><td style='padding: 8px; font-weight: bold; color: #555;'>Date:</td>");
        content.append("<td style='padding: 8px; color: #333;'>").append(event.getStartDate().format(dateFormatter));
        
        if (event.getHasTime()) {
            content.append(" at ").append(event.getStartDate().format(timeFormatter));
            if (event.getEndDate() != null && event.getHasEndTime()) {
                content.append(" - ").append(event.getEndDate().format(timeFormatter));
            }
        }
        content.append("</td></tr>");
        
        // Location
        if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
            content.append("<tr><td style='padding: 8px; font-weight: bold; color: #555;'>Location:</td>");
            content.append("<td style='padding: 8px; color: #333;'>").append(event.getLocation()).append("</td></tr>");
        }
        
        content.append("</table>");
        content.append("</div>");
        
        // Call to action
        content.append("<div style='text-align: center; margin-top: 20px;'>");
        content.append("<a href='http://localhost:5174/calendar' style='background-color: ").append(event.getColor());
        content.append("; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>");
        content.append("View Event in Calendar</a>");
        content.append("</div>");
        
        // Footer
        content.append("<div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;'>");
        content.append("<p>This is an automated notification from the HRM Calendar System.</p>");
        content.append("<p>If you have any questions, please contact your HR department.</p>");
        content.append("</div>");
        
        content.append("</div></body></html>");
        
        return content.toString();
    }

    /**
     * Parse employee IDs from string format
     */
    private List<Long> parseEmployeeIds(String employeeIdsStr) {
        try {
            if (employeeIdsStr == null || employeeIdsStr.trim().isEmpty()) {
                return new ArrayList<>();
            }
            
            // Handle string format like "[1,2,3]"
            if (employeeIdsStr.startsWith("[") && employeeIdsStr.endsWith("]")) {
                String[] ids = employeeIdsStr.substring(1, employeeIdsStr.length() - 1).split(",");
                List<Long> result = new ArrayList<>();
                for (String id : ids) {
                    if (!id.trim().isEmpty()) {
                        result.add(Long.parseLong(id.trim()));
                    }
                }
                return result;
            }
            
            // Handle comma-separated format like "1,2,3"
            String[] ids = employeeIdsStr.split(",");
            List<Long> result = new ArrayList<>();
            for (String id : ids) {
                if (!id.trim().isEmpty()) {
                    result.add(Long.parseLong(id.trim()));
                }
            }
            return result;
            
        } catch (Exception e) {
            logger.error("Error parsing employee IDs: {}", employeeIdsStr, e);
            return new ArrayList<>();
        }
    }
}
