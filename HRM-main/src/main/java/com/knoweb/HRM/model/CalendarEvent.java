package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "calendar_events")
public class CalendarEvent implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = true)
    private LocalDateTime endDate;

    @Column(name = "event_type", nullable = false)
    private String eventType; // HOLIDAY, MEETING, DEADLINE, REMINDER, FUNCTION, etc.

    @Column(name = "color", nullable = false)
    private String color; // Hex color code for UI

    @Column(name = "all_day", nullable = false)
    private Boolean allDay = false;

    @Column(name = "location")
    private String location;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "status")
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "completion_percentage")
    private Integer completionPercentage = 0;

    @Column(name = "has_time")
    private Boolean hasTime = false; // Default to false - time only shown when user requests

    @Column(name = "is_end_date_optional")
    private Boolean isEndDateOptional = true; // Default to true - end date is optional

    @Column(name = "has_end_time")
    private Boolean hasEndTime = false; // Separate control for end time

    @Column(name = "visibility", nullable = false)
    private String visibility = "COMPANY_ONLY"; // COMPANY_ONLY, SELECTED_EMPLOYEES, ALL_EMPLOYEES, DEPARTMENT, DESIGNATION

    @Column(name = "selected_departments")
    private String selectedDepartments; // JSON array of selected department IDs

    @Column(name = "selected_sub_departments")
    private String selectedSubDepartments; // JSON array of selected sub-department IDs

    @Column(name = "include_all_sub_departments")
    private Boolean includeAllSubDepartments = false;

    @Column(name = "unit_id")
    private Long unitId; // This will be used as departmentId for frontend

    // Getter for frontend compatibility
    public Long getDepartmentId() {
        return unitId;
    }

    // Setter for frontend compatibility
    public void setDepartmentId(Long departmentId) {
        this.unitId = departmentId;
    }

    @Column(name = "employee_ids")
    private String employeeIds; // JSON string of selected employee IDs

    @Column(name = "designation_ids")
    private String designationIds; // JSON string of selected designation IDs

    @Column(name = "custom_event_type")
    private String customEventType; // For user-defined event types

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
