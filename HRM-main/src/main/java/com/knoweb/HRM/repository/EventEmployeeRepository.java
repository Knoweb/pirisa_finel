package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.EventEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventEmployeeRepository extends JpaRepository<EventEmployee, Long> {

    List<EventEmployee> findByEventId(Long eventId);

    List<EventEmployee> findByEmployeeId(Long employeeId);

    List<EventEmployee> findByCompanyId(Long companyId);

    List<EventEmployee> findByEventIdAndEmployeeId(Long eventId, Long employeeId);

    boolean existsByEventIdAndEmployeeId(Long eventId, Long employeeId);

    @Query("SELECT ee.employeeId FROM EventEmployee ee WHERE ee.event.id = :eventId")
    List<Long> findEmployeeIdsByEventId(@Param("eventId") Long eventId);

    @Query("SELECT ee FROM EventEmployee ee WHERE ee.employeeId = :employeeId AND ee.event.companyId = :companyId")
    List<EventEmployee> findByEmployeeIdAndCompanyId(@Param("employeeId") Long employeeId, @Param("companyId") Long companyId);

    void deleteByEventId(Long eventId);
}
