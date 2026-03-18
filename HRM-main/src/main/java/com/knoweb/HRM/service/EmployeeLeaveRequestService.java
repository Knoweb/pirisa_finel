package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.EmployeeLeave;
import com.knoweb.HRM.repository.EmployeeLeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EmployeeLeaveRequestService {

    @Autowired
    private EmployeeLeaveRequestRepository employeeLeaveRequestRepository;

    public EmployeeLeave createEmployeeLeave(EmployeeLeave employeeLeave) {
        return employeeLeaveRequestRepository.save(employeeLeave);
    }

    public EmployeeLeave updateEmployeeLeave(Long empleave_id, EmployeeLeave updateEmployeeLeave) {
        EmployeeLeave employeeLeave = getEmployeeLeaveById(empleave_id);
        if (employeeLeave != null) {
            employeeLeave.setLeaveStatus(updateEmployeeLeave.getLeaveStatus());
            return employeeLeaveRequestRepository.save(employeeLeave);
        }
        return null;
    }

    public EmployeeLeave getEmployeeLeaveById(long id) {
        Optional<EmployeeLeave> optionalUser = employeeLeaveRequestRepository.findById(id);
        return optionalUser.orElse(null);
    }

    public List<EmployeeLeave> getEmployeesOnLeaveForDate(LocalDateTime currentDate) {
        return employeeLeaveRequestRepository.findEmployeesOnLeaveForDate(currentDate);
    }

    public EmployeeLeave cancelLeaveAndMarkAttendance(long empId, String cancellationReason, String canceledBy) {
        LocalDateTime now = LocalDateTime.now();
        
        // Find active leave for the employee
        EmployeeLeave activeLeave = employeeLeaveRequestRepository.findActiveLeaveForEmployee(empId, now);
        
        if (activeLeave != null) {
            // Update leave status to cancelled
            activeLeave.setLeaveStatus("CANCELLED");
            activeLeave.setCancellationDate(now);
            activeLeave.setCancellationReason(cancellationReason);
            activeLeave.setCanceledBy(canceledBy);
            
            EmployeeLeave updatedLeave = employeeLeaveRequestRepository.save(activeLeave);
            
            // Create attendance record for the employee
            // Note: This would require injecting AttendanceService or AttendanceRepository
            // For now, we'll just return the updated leave
            return updatedLeave;
        }
        
        return null;
    }
}
