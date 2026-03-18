package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.EmployeeLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EmployeeLeaveRequestRepository extends JpaRepository<EmployeeLeave, Long> {
    @Query("SELECT el FROM EmployeeLeave el WHERE el.empId = :empId AND UPPER(el.leaveStatus) = 'APPROVED'")
    List<EmployeeLeave> findApprovedByEmpId(@Param("empId") long empId);

    @Query("SELECT el FROM EmployeeLeave el WHERE el.empId = :empId AND UPPER(el.leaveStatus) = 'APPROVED' AND el.leaveStartDay <= :asOf AND el.leaveEndDay <= :asOf")
    List<EmployeeLeave> findApprovedByEmpIdAsOf(@Param("empId") long empId, @Param("asOf") LocalDateTime asOf);

    @Query("SELECT el FROM EmployeeLeave el WHERE UPPER(el.leaveStatus) = 'APPROVED' AND el.leaveStartDay <= :currentDate AND el.leaveEndDay >= :currentDate")
    List<EmployeeLeave> findEmployeesOnLeaveForDate(@Param("currentDate") LocalDateTime currentDate);

    @Query("SELECT el FROM EmployeeLeave el WHERE el.empId = :empId AND UPPER(el.leaveStatus) = 'APPROVED' AND el.leaveStartDay <= :currentDate AND el.leaveEndDay >= :currentDate")
    EmployeeLeave findActiveLeaveForEmployee(@Param("empId") long empId, @Param("currentDate") LocalDateTime currentDate);
}
