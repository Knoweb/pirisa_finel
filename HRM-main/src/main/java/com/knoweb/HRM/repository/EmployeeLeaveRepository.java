package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.EmployeeLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmployeeLeaveRepository extends JpaRepository<EmployeeLeave, Long> {

    // Find leaves by employee ID and status
    List<EmployeeLeave> findByEmpIdAndLeaveStatus(Long empId, String leaveStatus);

    // Find leaves by status and company ID (through employee)
    @Query("SELECT el FROM EmployeeLeave el WHERE el.leaveStatus = :leaveStatus AND el.empId IN " +
           "(SELECT e.id FROM Employee e WHERE e.cmpId = :companyId)")
    List<EmployeeLeave> findByLeaveStatusAndCompanyId(@Param("leaveStatus") String leaveStatus, @Param("companyId") Long companyId);

    // Find leaves by employee ID within a date range
    @Query("SELECT el FROM EmployeeLeave el WHERE el.empId = :empId AND " +
           "((el.leaveStartDay BETWEEN :startDate AND :endDate) OR " +
           "(el.leaveEndDay BETWEEN :startDate AND :endDate) OR " +
           "(el.leaveStartDay <= :startDate AND el.leaveEndDay >= :endDate))")
    List<EmployeeLeave> findByEmpIdAndDateRange(
            @Param("empId") Long empId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // Find approved leaves overlapping with specific dates for a company
    @Query("SELECT el FROM EmployeeLeave el WHERE el.leaveStatus = 'APPROVED' AND el.empId IN " +
           "(SELECT e.id FROM Employee e WHERE e.cmpId = :companyId) AND " +
           "((el.leaveStartDay BETWEEN :startDate AND :endDate) OR " +
           "(el.leaveEndDay BETWEEN :startDate AND :endDate) OR " +
           "(el.leaveStartDay <= :startDate AND el.leaveEndDay >= :endDate))")
    List<EmployeeLeave> findApprovedLeavesByCompanyIdAndDateRange(
            @Param("companyId") Long companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // Check if employee is on leave on a specific date
    @Query("SELECT COUNT(el) > 0 FROM EmployeeLeave el WHERE el.empId = :empId AND " +
           "el.leaveStatus = 'APPROVED' AND :date >= el.leaveStartDay AND :date <= el.leaveEndDay")
    boolean isEmployeeOnLeave(@Param("empId") Long empId, @Param("date") LocalDateTime date);

    // Find leaves by type and status
    List<EmployeeLeave> findByLeaveTypeAndLeaveStatus(String leaveType, String leaveStatus);

    // Count leaves by employee and status
    @Query("SELECT COUNT(el) FROM EmployeeLeave el WHERE el.empId = :empId AND el.leaveStatus = :leaveStatus")
    long countByEmpIdAndLeaveStatus(@Param("empId") Long empId, @Param("leaveStatus") String leaveStatus);

    // Find upcoming approved leaves for an employee
    @Query("SELECT el FROM EmployeeLeave el WHERE el.empId = :empId AND el.leaveStatus = 'APPROVED' " +
           "AND el.leaveStartDay > :now ORDER BY el.leaveStartDay ASC")
    List<EmployeeLeave> findUpcomingApprovedLeaves(@Param("empId") Long empId, @Param("now") LocalDateTime now);

    // Find current approved leaves for an employee (currently on leave)
    @Query("SELECT el FROM EmployeeLeave el WHERE el.empId = :empId AND el.leaveStatus = 'APPROVED' " +
           "AND :now >= el.leaveStartDay AND :now <= el.leaveEndDay")
    List<EmployeeLeave> findCurrentApprovedLeaves(@Param("empId") Long empId, @Param("now") LocalDateTime now);
}
