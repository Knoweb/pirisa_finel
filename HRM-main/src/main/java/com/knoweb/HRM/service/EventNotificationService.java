package com.knoweb.HRM.service;

import com.knoweb.HRM.model.CalendarEvent;
import com.knoweb.HRM.model.EventEmployee;
import com.knoweb.HRM.repository.EventEmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventNotificationService {

    @Autowired
    private EventEmployeeRepository eventEmployeeRepository;

    /**
     * Send notifications to employees for a new event
     */
    public void sendEventNotifications(CalendarEvent event, List<Long> employeeIds) {
        if (event.getVisibility().equals("SELECTED_EMPLOYEES") && employeeIds != null && !employeeIds.isEmpty()) {
            // Mark notifications as sent for assigned employees
            List<EventEmployee> eventEmployees = eventEmployeeRepository.findByEventId(event.getId());
            for (EventEmployee eventEmployee : eventEmployees) {
                eventEmployee.setNotificationSent(true);
                eventEmployeeRepository.save(eventEmployee);
            }
            
            // Here you can integrate with actual notification systems:
            // - Email notifications
            // - Push notifications
            // - SMS notifications
            // - In-app notifications
            
            System.out.println("Event notifications sent for event: " + event.getTitle() + 
                             " to " + employeeIds.size() + " employees");
        }
    }

    /**
     * Send update notifications to employees for an existing event
     */
    public void sendEventUpdateNotifications(CalendarEvent event) {
        if (event.getVisibility().equals("SELECTED_EMPLOYEES")) {
            List<EventEmployee> eventEmployees = eventEmployeeRepository.findByEventId(event.getId());
            
            // Here you can integrate with actual notification systems
            System.out.println("Event update notifications sent for event: " + event.getTitle() + 
                             " to " + eventEmployees.size() + " assigned employees");
        }
    }

    /**
     * Send cancellation notifications to employees for a cancelled event
     */
    public void sendEventCancellationNotifications(CalendarEvent event) {
        if (event.getVisibility().equals("SELECTED_EMPLOYEES")) {
            List<EventEmployee> eventEmployees = eventEmployeeRepository.findByEventId(event.getId());
            
            // Here you can integrate with actual notification systems
            System.out.println("Event cancellation notifications sent for event: " + event.getTitle() + 
                             " to " + eventEmployees.size() + " assigned employees");
        }
    }

    /**
     * Get employees who haven't been notified yet
     */
    public List<Long> getUnnotifiedEmployeeIds(Long eventId) {
        List<EventEmployee> eventEmployees = eventEmployeeRepository.findByEventId(eventId);
        return eventEmployees.stream()
                .filter(ee -> !ee.getNotificationSent())
                .map(EventEmployee::getEmployeeId)
                .collect(Collectors.toList());
    }
}
