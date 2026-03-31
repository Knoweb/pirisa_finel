package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.HikvisionAttendanceEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HikvisionAttendanceEventRepository extends JpaRepository<HikvisionAttendanceEvent, Long> {

    boolean existsBySerialNo(long serialNo);

    List<HikvisionAttendanceEvent> findTop100ByProcessedFalseOrderByEventTimeDesc();

    @Query("SELECT e FROM HikvisionAttendanceEvent e WHERE e.processed = false AND (e.employeeRef = :employeeRef OR e.personNameRef = :personNameRef)")
    List<HikvisionAttendanceEvent> findUnresolvedEventsForRefs(@Param("employeeRef") String employeeRef, @Param("personNameRef") String personNameRef);
}
