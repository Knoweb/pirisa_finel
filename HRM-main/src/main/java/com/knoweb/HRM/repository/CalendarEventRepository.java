package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    // Find events by company ID
    List<CalendarEvent> findByCompanyId(Long companyId);

    // Find events by company ID within a date range
    @Query("SELECT e FROM CalendarEvent e WHERE e.companyId = :companyId AND " +
           "((e.startDate BETWEEN :start AND :end) OR " +
           "(e.endDate BETWEEN :start AND :end) OR " +
           "(e.startDate <= :start AND e.endDate >= :end))")
    List<CalendarEvent> findByCompanyIdAndDateRange(
            @Param("companyId") Long companyId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Find events by company ID for a specific month
    @Query("SELECT e FROM CalendarEvent e WHERE e.companyId = :companyId AND " +
           "YEAR(e.startDate) = :year AND MONTH(e.startDate) = :month")
    List<CalendarEvent> findByCompanyIdAndMonth(
            @Param("companyId") Long companyId,
            @Param("year") int year,
            @Param("month") int month
    );

    // Find events by event type
    List<CalendarEvent> findByCompanyIdAndEventType(Long companyId, String eventType);

    // Find upcoming events
    @Query("SELECT e FROM CalendarEvent e WHERE e.companyId = :companyId AND e.startDate > :now ORDER BY e.startDate ASC")
    List<CalendarEvent> findUpcomingEvents(@Param("companyId") Long companyId, @Param("now") LocalDateTime now);

    // Find events for today
    @Query("SELECT e FROM CalendarEvent e WHERE e.companyId = :companyId AND " +
           "DATE(e.startDate) = CURRENT_DATE")
    List<CalendarEvent> findTodayEvents(@Param("companyId") Long companyId);

    // Delete events by company ID (for cleanup)
    void deleteByCompanyId(Long companyId);
}
