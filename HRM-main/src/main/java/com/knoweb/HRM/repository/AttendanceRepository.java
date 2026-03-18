package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEmpId(long empId);

//    @Query("SELECT a FROM Attendance a JOIN a.employee e JOIN e.company c WHERE c.id = :cmpId")
//    List<Attendance> findByCompanyId(@Param("cmpId") Long cmpId);

    @Query("SELECT a FROM Attendance a " +
            "WHERE a.empId = :empId " +
            "  AND MONTH(a.startedAt) = :month")
    List<Attendance> findByEmpIdAndMonth(
            @Param("empId") long empId,
            @Param("month") int month);

}
